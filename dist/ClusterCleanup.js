"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterCleanup = void 0;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const client_ecs_1 = require("@aws-sdk/client-ecs");
const util_waiter_1 = require("@aws-sdk/util-waiter");
const _1 = require(".");
class ClusterCleanup {
    ecs;
    cloudFormation;
    events;
    launchTypes;
    TEN_MINUTES_IN_MS = 10 * 60 * 1000;
    THIRTY_SECONDS_IN_MS = 30 * 1000;
    constructor(config, ecs = new client_ecs_1.ECS(config), cloudFormation = new client_cloudformation_1.CloudFormation(config), events = new _1.ClusterCleanupEventEmitter(), launchTypes = [client_ecs_1.LaunchType.EC2, client_ecs_1.LaunchType.FARGATE]) {
        this.ecs = ecs;
        this.cloudFormation = cloudFormation;
        this.events = events;
        this.launchTypes = launchTypes;
    }
    get eventEmitter() {
        return this.events;
    }
    async deleteClusterAndResources(clusterName, stackName = `EC2ContainerService-${clusterName}`, verbose = 0, options = {
        waiterTimeoutMs: this.TEN_MINUTES_IN_MS,
        waiterPollMinDelayMs: this.THIRTY_SECONDS_IN_MS,
        stackEventsPollIntervalMs: this.THIRTY_SECONDS_IN_MS,
    }) {
        this.events.verbose = verbose;
        return this.deleteHelper(clusterName, stackName, verbose, options);
    }
    async deleteHelper(clusterName, stackName, verbose, options = {}) {
        const cleanedUpResources = [];
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
        if (verbose >= 2) {
            startTime = Date.now();
        }
        this.events.emit(_1.ClusterCleanupEvents.start, clusterName);
        if (!(await this.doesClusterExist(clusterName))) {
            this.events.emit(_1.ClusterCleanupEvents.doneWithError, new Error(`Cluster ${clusterName} does not exist in the region specified`));
            return [];
        }
        let services;
        let instances;
        let tasks;
        const stack = await this.describeStack(clusterName, stackName);
        if (stack) {
            this.events.emit(_1.ClusterCleanupEvents.stackFound, stack);
        }
        const foundServices = await this.getAllServicesFor(clusterName);
        if (foundServices.length > 0) {
            this.events.emit(_1.ClusterCleanupEvents.servicesFound, foundServices);
            services = await this.scaleServicesToZero(clusterName, foundServices);
            this.events.emit(_1.ClusterCleanupEvents.servicesScaledDown, services);
        }
        const foundTasks = await this.getAllTasksFor(clusterName);
        if (foundTasks.length > 0) {
            this.events.emit(_1.ClusterCleanupEvents.tasksFound, foundTasks);
            tasks = await this.stopTasks(clusterName, foundTasks);
            this.events.emit(_1.ClusterCleanupEvents.tasksStopped, tasks);
            cleanedUpResources.push(...tasks.map((t) => t.taskArn));
        }
        const foundInstances = await this.getAllInstancesFor(clusterName);
        if (foundInstances.length > 0) {
            this.events.emit(_1.ClusterCleanupEvents.instancesFound, foundInstances);
            instances = await this.deregisterContainerInstances(clusterName, foundInstances);
            this.events.emit(_1.ClusterCleanupEvents.instancesDeregistered, instances);
            cleanedUpResources.push(...instances.map((i) => i.containerInstanceArn));
        }
        if (foundServices.length > 0) {
            await this.deleteAllServices(clusterName, services.map((s) => s.serviceName));
            this.events.emit(_1.ClusterCleanupEvents.servicesDeleted, services);
            cleanedUpResources.push(...services.map((s) => s.serviceArn));
        }
        if (stack) {
            await this.deleteStack(clusterName);
            this.events.emit(_1.ClusterCleanupEvents.stackDeletionStarted, stack.StackId);
            try {
                const pollTimer = this.setupCloudFormationPolling(clusterName, options.stackEventsPollIntervalMs, cleanedUpResources);
                const result = await this.waitForStackDeletion(stack, options.waiterTimeoutMs, options.waiterPollMinDelayMs);
                if (result.state !== util_waiter_1.WaiterState.SUCCESS) {
                    clearInterval(pollTimer);
                    throw new Error(result.reason);
                }
                this.events.emit(_1.ClusterCleanupEvents.stackDeletionDone, stack.StackId);
                cleanedUpResources.push(stack.StackId);
                clearInterval(pollTimer);
                const deletedCluster = await this.deleteCluster(clusterName);
                this.events.emit(_1.ClusterCleanupEvents.clusterDeleted, deletedCluster);
                cleanedUpResources.push(deletedCluster.clusterArn);
                this.events.emit(_1.ClusterCleanupEvents.done, clusterName);
            }
            catch (e) {
                this.events.emit(_1.ClusterCleanupEvents.doneWithError, e);
                return [];
            }
        }
        else {
            const deletedCluster = await this.deleteCluster(clusterName);
            this.events.emit(_1.ClusterCleanupEvents.clusterDeleted, deletedCluster);
            cleanedUpResources.push(deletedCluster.clusterArn);
            this.events.emit(_1.ClusterCleanupEvents.done, clusterName);
        }
        if (verbose >= 2) {
            console.log(`Deleting cluster ${clusterName} took ${(Date.now() - startTime) / 1000}s.`);
        }
        return cleanedUpResources;
    }
    async describeCluster(clusterName) {
        try {
            const command = new client_ecs_1.DescribeClustersCommand({ clusters: [clusterName] });
            const response = await this.ecs.send(command);
            return response.clusters;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async doesClusterExist(clusterName) {
        try {
            const clusters = await this.describeCluster(clusterName);
            return (clusters
                .filter(({ status }) => status !== 'INACTIVE')
                .filter(({ clusterName }) => clusterName === clusterName).length !== 0);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return false;
        }
    }
    async describeStack(clusterName, stackName) {
        try {
            const command = new client_cloudformation_1.DescribeStacksCommand({
                StackName: stackName || `EC2ContainerService-${clusterName}`,
            });
            const describeStackResponse = await this.cloudFormation.send(command);
            return describeStackResponse.Stacks[0];
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return null;
        }
    }
    async getAllServicesFor(clusterName) {
        try {
            const listServiceResponses = await Promise.all(this.launchTypes.map((l) => this.ecs.send(new client_ecs_1.ListServicesCommand({ cluster: clusterName, launchType: l }))));
            return listServiceResponses.reduce((acc, r) => {
                return acc.concat(r.serviceArns);
            }, []);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async scaleServicesToZero(clusterName, serviceArns) {
        try {
            const scaleServiceResponses = await Promise.all(serviceArns.map((s) => this.ecs.send(new client_ecs_1.UpdateServiceCommand({
                cluster: clusterName,
                service: s,
                desiredCount: 0,
            }))));
            return scaleServiceResponses.reduce((acc, r) => {
                return acc.concat(r.service);
            }, []);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async getAllTasksFor(clusterName) {
        try {
            const command = new client_ecs_1.ListTasksCommand({ cluster: clusterName });
            const listTasksResponse = await this.ecs.send(command);
            return listTasksResponse.taskArns;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async stopTasks(clusterName, taskArns) {
        try {
            const reason = 'Cluster being deleted';
            const stopTaskResponses = await Promise.all(taskArns.map((task) => this.ecs.send(new client_ecs_1.StopTaskCommand({ task, cluster: clusterName, reason }))));
            return stopTaskResponses.map((r) => r.task);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async getAllInstancesFor(clusterName) {
        try {
            const listInstanceResponse = await this.ecs.send(new client_ecs_1.ListContainerInstancesCommand({ cluster: clusterName }));
            return listInstanceResponse.containerInstanceArns;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async deregisterContainerInstances(clusterName, instances) {
        try {
            const deregisterResponses = await Promise.all(instances.map((i) => this.ecs.send(new client_ecs_1.DeregisterContainerInstanceCommand({
                cluster: clusterName,
                containerInstance: i,
                force: true,
            }))));
            return deregisterResponses.reduce((acc, r) => {
                return acc.concat(r.containerInstance);
            }, []);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async deleteAllServices(clusterName, serviceNames) {
        try {
            const deleteServicesResponses = await Promise.all(serviceNames.map((service) => this.ecs.send(new client_ecs_1.DeleteServiceCommand({ cluster: clusterName, service }))));
            return deleteServicesResponses.reduce((acc, r) => {
                return acc.concat(r.service);
            }, []);
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async deleteStack(clusterName) {
        try {
            const deleteStackResponse = await this.cloudFormation.send(new client_cloudformation_1.DeleteStackCommand({
                StackName: `EC2ContainerService-${clusterName}`,
            }));
            return deleteStackResponse;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return e;
        }
    }
    async describeStackEvents(clusterName) {
        try {
            const describeStackEventsResponse = await this.cloudFormation.send(new client_cloudformation_1.DescribeStackEventsCommand({
                StackName: `EC2ContainerService-${clusterName}`,
            }));
            return describeStackEventsResponse.StackEvents;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.error, e);
            return [];
        }
    }
    async waitForStackDeletion(stack, pollTimeoutInMs, pollMinDelayMs) {
        const waiterResult = await (0, client_cloudformation_1.waitUntilStackDeleteComplete)({
            client: this.cloudFormation,
            maxWaitTime: Math.round(pollTimeoutInMs / 1000),
            minDelay: Math.round(pollMinDelayMs / 1000),
        }, { StackName: stack.StackId });
        return waiterResult;
    }
    setupCloudFormationPolling(clusterName, pollIntervalInMs, collector = []) {
        const alreadyDeleted = [];
        const pollEvent = async () => {
            try {
                const stackEvents = (await this.describeStackEvents(clusterName)) || [];
                stackEvents
                    .filter((e) => e.ResourceStatus === 'DELETE_COMPLETE')
                    .filter((e) => !alreadyDeleted.includes(e.LogicalResourceId))
                    .forEach((e) => {
                    alreadyDeleted.push(e.LogicalResourceId);
                    collector.push(e.PhysicalResourceId);
                    this.events.emit(_1.ClusterCleanupEvents.resourceDeleted, e);
                });
            }
            catch (e) {
                this.events.emit(_1.ClusterCleanupEvents.error, e);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return setInterval(pollEvent, pollIntervalInMs);
    }
    async deleteCluster(clusterName) {
        try {
            const response = await this.ecs.send(new client_ecs_1.DeleteClusterCommand({ cluster: clusterName }));
            return response.cluster;
        }
        catch (e) {
            this.events.emit(_1.ClusterCleanupEvents.doneWithError, e);
        }
    }
}
exports.ClusterCleanup = ClusterCleanup;
