"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterCleanup = void 0;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const client_ecs_1 = require("@aws-sdk/client-ecs");
const _1 = require(".");
class ClusterCleanup {
    launchTypes;
    ecs;
    cloudFormation;
    events;
    constructor(config) {
        this.ecs = new client_ecs_1.ECS(config);
        this.cloudFormation = new client_cloudformation_1.CloudFormation(config);
        this.launchTypes = [client_ecs_1.LaunchType.EC2];
        this.events = new _1.ClusterCleanupEventEmitter();
        if (config.enableFargate) {
            this.launchTypes.push(client_ecs_1.LaunchType.FARGATE);
        }
    }
    deleteClusterAndResources(cluster, options = {}) {
        this.events.verbose = options.verbose;
        setImmediate(this.deleteHelper.bind(this), cluster, options);
        return this.events;
    }
    async deleteHelper(cluster, options) {
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
        this.events.emit(_1.ClusterCleanupEvents.start, cluster);
        if (!(await this.doesClusterExist(cluster))) {
            this.events.emit(_1.ClusterCleanupEvents.doneWithError, new Error(`Cluster ${cluster} does not exist in the region specified`));
            return;
        }
        let services;
        let instances;
        let tasks;
        const stack = await this.describeStack(cluster);
        if (stack) {
            this.events.emit(_1.ClusterCleanupEvents.stackFound, stack);
        }
        const foundServices = await this.getAllServicesFor(cluster);
        if (foundServices.length > 0) {
            this.events.emit(_1.ClusterCleanupEvents.servicesFound, foundServices);
            services = await this.scaleServicesToZero(cluster, foundServices);
            this.events.emit(_1.ClusterCleanupEvents.servicesScaledDown, services);
        }
        const foundTasks = await this.getAllTasksFor(cluster);
        if (foundTasks.length > 0) {
            this.events.emit(_1.ClusterCleanupEvents.tasksFound, foundTasks);
            tasks = await this.stopTasks(cluster, foundTasks);
            this.events.emit(_1.ClusterCleanupEvents.tasksStopped, tasks);
        }
        const foundInstances = await this.getAllInstancesFor(cluster);
        if (foundInstances.length > 0) {
            this.events.emit(_1.ClusterCleanupEvents.instancesFound, foundInstances);
            instances = await this.deregisterContainerInstances(cluster, foundInstances);
            this.events.emit(_1.ClusterCleanupEvents.instancesDeregistered, instances);
        }
        if (foundServices.length > 0) {
            await this.deleteAllServices(cluster, services.map((s) => s.serviceName));
            this.events.emit(_1.ClusterCleanupEvents.servicesDeleted, services);
        }
        if (stack) {
            await this.deleteStack(cluster);
            this.events.emit(_1.ClusterCleanupEvents.stackDeletionStarted, stack.StackId);
            try {
                await this.pollCloudFormationForChanges(cluster, stack);
                this.events.emit(_1.ClusterCleanupEvents.stackDeletionDone, stack.StackId);
                const deletedCluster = await this.deleteCluster(cluster);
                this.events.emit(_1.ClusterCleanupEvents.clusterDeleted, deletedCluster);
                this.events.emit(_1.ClusterCleanupEvents.done, cluster);
            }
            catch (e) {
                this.events.emit(_1.ClusterCleanupEvents.doneWithError, e);
                return;
            }
        }
        else {
            const deletedCluster = await this.deleteCluster(cluster);
            this.events.emit(_1.ClusterCleanupEvents.clusterDeleted, deletedCluster);
            this.events.emit(_1.ClusterCleanupEvents.done, cluster);
        }
        if (options.verbose) {
            console.log(`Deleting cluster ${cluster} took ${(Date.now() - startTime) / 1000}s.`);
        }
    }
    async describeCluster(cluster) {
        try {
            const response = await this.ecs.describeClusters({ clusters: [cluster] });
            return response.clusters;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async doesClusterExist(cluster) {
        try {
            const clusters = await this.describeCluster(cluster);
            return (clusters
                .filter(({ status }) => status !== 'INACTIVE')
                .filter(({ clusterName }) => clusterName === cluster).length !== 0);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return false;
        }
    }
    async describeStack(cluster) {
        try {
            const describeStackResponse = await this.cloudFormation.describeStacks({
                StackName: `EC2ContainerService-${cluster}`,
            });
            return describeStackResponse.Stacks[0];
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return null;
        }
    }
    async getAllServicesFor(cluster) {
        try {
            const listServiceResponses = await Promise.all(this.launchTypes.map((l) => this.ecs.listServices({ cluster, launchType: l })));
            return listServiceResponses.reduce((acc, r) => {
                return acc.concat(r.serviceArns);
            }, []);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async scaleServicesToZero(cluster, serviceArns) {
        try {
            const scaleServiceResponses = await Promise.all(serviceArns.map((s) => this.ecs.updateService({ cluster, service: s, desiredCount: 0 })));
            return scaleServiceResponses.reduce((acc, r) => {
                return acc.concat(r.service);
            }, []);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async getAllTasksFor(cluster) {
        try {
            const listTasksResponse = await this.ecs.listTasks({ cluster });
            return listTasksResponse.taskArns;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async stopTasks(cluster, taskArns) {
        try {
            const reason = 'Cluster being deleted';
            const stopTaskResponses = await Promise.all(taskArns.map((task) => this.ecs.stopTask({ task, cluster, reason })));
            return stopTaskResponses.map((r) => r.task);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async getAllInstancesFor(cluster) {
        try {
            const listInstanceResponse = await this.ecs.listContainerInstances({
                cluster,
            });
            return listInstanceResponse.containerInstanceArns;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async deregisterContainerInstances(cluster, instances) {
        try {
            const deregisterResponses = await Promise.all(instances.map((i) => this.ecs.deregisterContainerInstance({
                cluster,
                containerInstance: i,
                force: true,
            })));
            return deregisterResponses.reduce((acc, r) => {
                return acc.concat(r.containerInstance);
            }, []);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async deleteAllServices(cluster, services) {
        try {
            const deleteServicesResponses = await Promise.all(services.map((service) => this.ecs.deleteService({ cluster, service })));
            return deleteServicesResponses.reduce((acc, r) => {
                return acc.concat(r.service);
            }, []);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async describeStackResources(stackId, resourceId) {
        try {
            const describeResourceResponse = await this.cloudFormation.describeStackResources({
                StackName: stackId,
                LogicalResourceId: resourceId,
            });
            return describeResourceResponse.StackResources;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async deleteStack(cluster) {
        try {
            const deleteStackResponse = await this.cloudFormation.deleteStack({
                StackName: `EC2ContainerService-${cluster}`,
            });
            return deleteStackResponse;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return e;
        }
    }
    async describeStackEvents(cluster) {
        try {
            const describeStackEventsResponse = await this.cloudFormation.describeStackEvents({
                StackName: `EC2ContainerService-${cluster}`,
            });
            return describeStackEventsResponse.StackEvents;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async pollCloudFormationForChanges(cluster, stack) {
        const TEN_MINUTES = 10 * 60;
        const pollTimer = this.setupCloudFormationPolling(cluster);
        const waiterResult = await (0, client_cloudformation_1.waitUntilStackDeleteComplete)({ client: this.cloudFormation, maxWaitTime: TEN_MINUTES }, { StackName: stack.StackId });
        clearInterval(pollTimer);
        return waiterResult;
    }
    setupCloudFormationPolling(cluster) {
        const TEN_SECONDS = 10 * 1000;
        const alreadyDeleted = [];
        const pollEvent = async () => {
            try {
                const stackEvents = (await this.describeStackEvents(cluster)) || [];
                stackEvents
                    .filter((e) => e.ResourceStatus === 'DELETE_COMPLETE')
                    .filter((e) => !alreadyDeleted.includes(e.LogicalResourceId))
                    .forEach((e) => {
                    alreadyDeleted.push(e.LogicalResourceId);
                    this.events.emit(_1.ClusterCleanupEvents.resourceDeleted, e);
                });
            }
            catch (e) {
                this.events.emit(_1.ClusterCleanupEvents.error, e);
            }
        };
        return setInterval(pollEvent, TEN_SECONDS);
    }
    async deleteCluster(cluster) {
        try {
            const response = await this.ecs.deleteCluster({ cluster });
            return response.cluster;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.doneWithError, e);
        }
    }
}
exports.ClusterCleanup = ClusterCleanup;
