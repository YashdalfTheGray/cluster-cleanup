"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS = require("aws-sdk/clients/ecs");
const CloudFormation = require("aws-sdk/clients/cloudformation");
const _1 = require(".");
class ECSClusterManager {
    constructor(config) {
        this.ecs = new ECS(config);
        this.cloudFormation = new CloudFormation(config);
        this.launchTypes = ['EC2'];
        if (config.enableFargate) {
            this.launchTypes.push('FARGATE');
        }
    }
    async deleteClusterAndResources(cluster) {
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
        const events = new _1.ECSClusterManagerEventEmitter();
        const stack = await this.describeStack(cluster);
        console.log(stack);
        const foundServices = await this.getAllServicesFor(cluster);
        events.emit(_1.ClusterManagerEvents.servicesFound, foundServices);
        if (foundServices.length > 0) {
            const scaledServices = await this.scaleServicesToZero(cluster, foundServices);
            events.emit(_1.ClusterManagerEvents.servicesScaledDown, scaledServices);
        }
        const foundInstances = await this.getAllInstancesFor(cluster);
        if (foundInstances.length > 0) {
            await this.deregisterContainerInstances(cluster, foundInstances);
        }
        return events;
    }
    async getAllServicesFor(cluster) {
        try {
            const listServiceResponses = await Promise.all(this.launchTypes.map(l => this.ecs.listServices({ cluster, launchType: l }).promise()));
            return listServiceResponses.reduce((acc, r) => {
                return acc.concat(r.serviceArns);
            }, []);
        }
        catch (e) {
            console.log(e.message);
            return [];
        }
    }
    async scaleServicesToZero(cluster, serviceArns) {
        try {
            const scaleServiceResponses = await Promise.all(serviceArns.map(s => this.ecs.updateService({ cluster, service: s, desiredCount: 0 }).promise()));
            return scaleServiceResponses.reduce((acc, r) => {
                return acc.concat(r.service);
            }, []);
        }
        catch (e) {
            console.log(e.message);
            return [];
        }
    }
    async getAllInstancesFor(cluster) {
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
    async deregisterContainerInstances(cluster, instances) {
        try {
            const deregisterResponses = await Promise.all(instances.map(i => this.ecs.deregisterContainerInstance({ cluster, containerInstance: i, force: true }).promise()));
            return deregisterResponses.reduce((acc, r) => {
                return acc.concat(r.containerInstance);
            }, []);
        }
        catch (e) {
            console.log(e.message);
            return [];
        }
    }
    async deleteAllServices(cluster, services) {
        try {
            const deleteServicesResponses = await Promise.all(services.map(service => this.ecs.deleteService({ cluster, service }).promise()));
            return deleteServicesResponses.reduce((acc, r) => {
                return acc.concat(r.service);
            }, []);
        }
        catch (e) {
            console.log(e.message);
            return [];
        }
    }
    async describeStack(cluster) {
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
    async deleteStack(cluster) {
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
}
exports.ECSClusterManager = ECSClusterManager;
