import * as ECS from 'aws-sdk/clients/ecs';
import * as CloudFormation from 'aws-sdk/clients/cloudformation';
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service';

import { ClusterCleanupEventEmitter, ClusterCleanupEvents } from '.';

export interface ClusterCleanupConfig extends ServiceConfigurationOptions{
    enableFargate?: boolean;
}

export interface DeleteOptions {
    verbose?: boolean;
}

export class ClusterCleanup {
	private launchTypes: ECS.LaunchType[];
    private ecs: ECS;
    private cloudFormation: CloudFormation;
    private events: ClusterCleanupEventEmitter;

    public constructor(config?: ClusterCleanupConfig) {
        this.ecs = new ECS(config);
        this.cloudFormation = new CloudFormation(config);
        this.launchTypes = ['EC2'];
        this.events = new ClusterCleanupEventEmitter();

        if (config.enableFargate) {
            this.launchTypes.push('FARGATE');
        }
    }

    public deleteClusterAndResources(cluster: string, options: DeleteOptions = {}): ClusterCleanupEventEmitter {
        this.events.verbose = options.verbose;

        setImmediate(this.deleteHelper.bind(this), cluster, options);

        return this.events;
    }

    private async deleteHelper(cluster: string, options: DeleteOptions) {
        // 1. find CloudFormation stack
        // 2. find all services
        // 3. batch scale all services down to 0
        // 4. find all container instances
        // 5. deregister all container instances
        // 6. find all services, again
        // 7. delete all services
        // 8. delete CloudFormation stack
        // 9. poll CloudFormation until stack deleted
        // 10. delete cluster
        let startTime;

        if (options.verbose) {
            startTime = Date.now();
        }

        this.events.emit(ClusterCleanupEvents.start, cluster);

        if (!(await this.doesClusterExist(cluster))) {
            this.events.emit(
                ClusterCleanupEvents.doneWithError,
                new Error(`Cluster ${cluster} does not exist in the region specified`)
            );
            return;
        }

        let services: ECS.Service[];
        let instances: ECS.ContainerInstance[];
        let tasks: ECS.Task[];

        const stack = await this.describeStack(cluster);
        if (stack) {
            this.events.emit(ClusterCleanupEvents.stackFound, stack);
        }

        const foundServices = await this.getAllServicesFor(cluster);
        if (foundServices.length > 0) {
            this.events.emit(ClusterCleanupEvents.servicesFound, foundServices);
            services = await this.scaleServicesToZero(cluster, foundServices);
            this.events.emit(ClusterCleanupEvents.servicesScaledDown, services);
        }

        const foundTasks = await this.getAllTasksFor(cluster);
        if (foundTasks.length > 0) {
            this.events.emit(ClusterCleanupEvents.tasksFound, foundTasks);
            tasks = await this.stopTasks(cluster, foundTasks);
            this.events.emit(ClusterCleanupEvents.tasksStopped, tasks);
        }

        const foundInstances = await this.getAllInstancesFor(cluster);
        if (foundInstances.length > 0) {
            this.events.emit(ClusterCleanupEvents.instancesFound, foundInstances);
            instances = await this.deregisterContainerInstances(cluster, foundInstances);
            this.events.emit(ClusterCleanupEvents.instancesDeregistered, instances);
        }

        if (foundServices.length > 0) {
            await this.deleteAllServices(cluster, services.map(s => s.serviceName));
            this.events.emit(ClusterCleanupEvents.servicesDeleted, services);
        }

        if (stack) {
            await this.deleteStack(cluster);
            this.events.emit(ClusterCleanupEvents.stackDeletionStarted, stack.StackId);

            try {
                await this.pollCloudFormationForChanges(cluster, stack);
                this.events.emit(ClusterCleanupEvents.stackDeletionDone, stack.StackId);

                const deletedCluster = await this.deleteCluster(cluster);
                this.events.emit(ClusterCleanupEvents.clusterDeleted, deletedCluster);
                this.events.emit(ClusterCleanupEvents.done, cluster);
            }
            catch (e) {
                this.events.emit(ClusterCleanupEvents.doneWithError, e);
                return;
            }
        }
        else {
            const deletedCluster = await this.deleteCluster(cluster);
            this.events.emit(ClusterCleanupEvents.clusterDeleted, deletedCluster);
            this.events.emit(ClusterCleanupEvents.done, cluster);
        }

        if (options.verbose) {
            console.log(`Deleting cluster ${cluster} took ${(Date.now() - startTime) / 1000}s.`);
        }
    }

    private async describeCluster(cluster: string): Promise<ECS.Cluster[]> {
        try {
            const response = await this.ecs.describeClusters({ clusters: [cluster] }).promise();
            return response.clusters;
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async doesClusterExist(cluster: string): Promise<boolean> {
        try {
            const clusters = await this.describeCluster(cluster);
            return clusters
            .filter(({ status }) => status !== 'INACTIVE')
            .filter(({ clusterName }) => clusterName === cluster)
            .length !== 0;
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return false;
        }
    }

    private async describeStack(cluster: string): Promise<CloudFormation.Stack> {
        try {
            const describeStackResponse = await this.cloudFormation.describeStacks({
                StackName: `EC2ContainerService-${cluster}`
            }).promise();

            return describeStackResponse.Stacks[0];
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return null;
        }
    }

    private async getAllServicesFor(cluster: string): Promise<string[]> {
        try {
            const listServiceResponses = await Promise.all(this.launchTypes.map(
                l => this.ecs.listServices({ cluster, launchType: l }).promise()
            ));

            return listServiceResponses.reduce((acc, r) => {
                return acc.concat(r.serviceArns);
            }, []);
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async scaleServicesToZero(cluster: string, serviceArns: string[]): Promise<ECS.Services> {
        try {
            const scaleServiceResponses = await Promise.all(serviceArns.map(
                s => this.ecs.updateService({ cluster, service: s, desiredCount: 0 }).promise()
            ));

            return scaleServiceResponses.reduce((acc, r) => {
                return acc.concat(r.service);
            }, []);
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async getAllTasksFor(cluster: string): Promise<string[]>{
        try {
            const listTasksResponse = await this.ecs.listTasks({ cluster }).promise();
            return listTasksResponse.taskArns;
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async stopTasks(cluster: string, taskArns: string[]): Promise<ECS.Task[]> {
        try {
            const reason = 'Cluster being deleted';
            const stopTaskResponses = await Promise.all(taskArns.map(
                task => this.ecs.stopTask({ task, cluster, reason }).promise()
            ));
            return stopTaskResponses.map(r => r.task);
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async getAllInstancesFor(cluster: string): Promise<string[]> {
        try {
            const listInstanceResponse = await this.ecs.listContainerInstances({
                cluster
            }).promise();

            return listInstanceResponse.containerInstanceArns;
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async deregisterContainerInstances(cluster: string, instances: string[]): Promise<ECS.ContainerInstance[]> {
        try {
            const deregisterResponses = await Promise.all(instances.map(
                i => this.ecs.deregisterContainerInstance({ cluster, containerInstance: i, force: true }).promise()
            ));

            return deregisterResponses.reduce((acc, r) => {
                return acc.concat(r.containerInstance);
            }, []);
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async deleteAllServices(cluster: string, services: string[]): Promise<ECS.Services> {
        try {
            const deleteServicesResponses = await Promise.all(services.map(
                service => this.ecs.deleteService({ cluster, service }).promise()
            ));

            return deleteServicesResponses.reduce((acc, r) => {
                return acc.concat(r.service);
            }, []);
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async describeStackResources(stackId: string, resourceId: string): Promise<CloudFormation.StackResource[]> {
        try {
            const describeResourceResponse = await this.cloudFormation.describeStackResources({
                StackName: stackId,
                LogicalResourceId: resourceId
            }).promise();

            return describeResourceResponse.StackResources;
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private async deleteStack(cluster: string): Promise<Object> {
        try {
            const deleteStackResponse = await this.cloudFormation.deleteStack({
                StackName: `EC2ContainerService-${cluster}`
            }).promise();

            return deleteStackResponse;
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return e;
        }
    }

    private async describeStackEvents(cluster: string): Promise<CloudFormation.StackEvent[]> {
        try {
            const describeStackEventsResponse = await this.cloudFormation.describeStackEvents({
                StackName: `EC2ContainerService-${cluster}`
            }).promise();

            return describeStackEventsResponse.StackEvents;
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.error, e);
            return [];
        }
    }

    private pollCloudFormationForChanges(cluster: string, stack: CloudFormation.Stack): Promise<any> {
        const TEN_MINUTES = 10 * 60 * 1000;
        let pollTimer, timeoutTimer;

        pollTimer = this.setupCloudFormationPolling(cluster);

        const timeoutPromise = new Promise((resolve, reject) => {
            timeoutTimer = setTimeout(() => {
                clearInterval(pollTimer);
                reject(new Error('CloudFormation stack deletion timed out!'));
            }, TEN_MINUTES);
        });

        const deletePromise = this.cloudFormation.waitFor(
            'stackDeleteComplete',
            { StackName: stack.StackId }
        ).promise().then(describeStacksResponse => {
            clearInterval(pollTimer);
            clearTimeout(timeoutTimer);
            return describeStacksResponse.Stacks;
        });

        return Promise.race([deletePromise, timeoutPromise]);
    }

    private setupCloudFormationPolling(cluster: string): NodeJS.Timer {
        const TEN_SECONDS = 10 * 1000;
        const alreadyDeleted = [];

        const pollEvent = async () => {
            try {
                const stackEvents = await this.describeStackEvents(cluster) || [];
                stackEvents
                .filter(e => e.ResourceStatus === 'DELETE_COMPLETE')
                .filter(e => !alreadyDeleted.includes(e.LogicalResourceId))
                .forEach(e => {
                    alreadyDeleted.push(e.LogicalResourceId);
                    this.events.emit(ClusterCleanupEvents.resourceDeleted, e);
                });
            }
            catch (e) {
                this.events.emit(ClusterCleanupEvents.error, e);
            }
        };

        return setInterval(pollEvent, TEN_SECONDS);
    }

    private async deleteCluster(cluster: string): Promise<ECS.Cluster> {
        try {
            const response = await this.ecs.deleteCluster({ cluster }).promise();
            return response.cluster;
        }
        catch (e) {
            this.events.emit(ClusterCleanupEvents.doneWithError, e);
        }
    }
}
