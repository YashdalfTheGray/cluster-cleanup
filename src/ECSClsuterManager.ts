import * as ECS from 'aws-sdk/clients/ecs';
import * as CloudFormation from 'aws-sdk/clients/cloudformation';
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service';

import { ECSClusterManagerEventEmitter, ClusterManagerEvents } from '.';

export interface ECSClusterManagerConfig extends ServiceConfigurationOptions{
    enableFargate?: boolean;
}

export interface DeleteOptions {
    verbose?: boolean;
    block?: boolean;
}

export class ECSClusterManager {
	private launchTypes: ECS.LaunchType[];
    private ecs: ECS;
    private cloudFormation: CloudFormation;

    public constructor(config?: ECSClusterManagerConfig) {
        this.ecs = new ECS(config);
        this.cloudFormation = new CloudFormation(config);
        this.launchTypes = ['EC2'];

        if (config.enableFargate) {
            this.launchTypes.push('FARGATE');
        }
    }

    public deleteClusterAndResources(cluster: string, options: DeleteOptions = {}): ECSClusterManagerEventEmitter {
        const events = new ECSClusterManagerEventEmitter(options.verbose);

        setImmediate(this.deleteHelper.bind(this), cluster, events, options);

        return events;
    }

    private async deleteHelper(cluster: string, events: ECSClusterManagerEventEmitter, options: DeleteOptions) {
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

        events.emit(ClusterManagerEvents.start, cluster);
        let services: ECS.Service[];
        let instances: ECS.ContainerInstance[];

        const stack = await this.describeStack(cluster);
        if (stack) {
            events.emit(ClusterManagerEvents.stackFound, stack);
        }

        const foundServices = await this.getAllServicesFor(cluster);
        if (foundServices.length > 0) {
            events.emit(ClusterManagerEvents.servicesFound, foundServices);
            services = await this.scaleServicesToZero(cluster, foundServices);
            events.emit(ClusterManagerEvents.servicesScaledDown, services);
        }

        const foundInstances = await this.getAllInstancesFor(cluster);
        if (foundInstances.length > 0) {
            events.emit(ClusterManagerEvents.instancesFound, foundInstances);
            instances = await this.deregisterContainerInstances(cluster, foundInstances);
            events.emit(ClusterManagerEvents.instancesDeregistered, instances);
        }

        if (foundServices.length > 0) {
            await this.deleteAllServices(cluster, services.map(s => s.serviceName));
            events.emit(ClusterManagerEvents.servicesDeleted, services);
        }

        await this.deleteStack(cluster);
        events.emit(ClusterManagerEvents.stackDeletionStarted, cluster);

        events.emit(ClusterManagerEvents.done, cluster);
    }

    private async describeStack(cluster: string): Promise<CloudFormation.Stack> {
        try {
            const describeStackResponse = await this.cloudFormation.describeStacks({
                StackName: `EC2ContainerService-${cluster}`
            }).promise();

            return describeStackResponse.Stacks[0];
        }
        catch (e) {
            console.log(e.message);
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
            console.log(e.message);
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
            console.log(e.message);
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
            console.log(e.message);
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
            console.log(e.message);
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
            console.log(e.message);
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
            console.log(e.message);
            return e;
        }
    }

    private pollCloudFormationForChanges(cluster: string, events: ECSClusterManagerEventEmitter): Promise<void> {
        const TEN_SECONDS = 10 * 1000;
        const TEN_MINUTES = 10 * 60 * 1000;

        const pollTimer = setInterval(
            this.pollCloudFormationForEvents.bind(this),
            TEN_SECONDS,
            cluster, events
        );

        return Promise.resolve();
    }

    private pollCloudFormationForEvents(cluster: string, events: ECSClusterManagerEventEmitter): void {

    }
}