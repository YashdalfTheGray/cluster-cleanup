"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS = require("aws-sdk/clients/ecs");
const events_1 = require("events");
class ECSClusterManager {
    constructor(config) {
        this.ecs = new ECS(config);
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
        const foundServices = await this.getAllServicesFor(cluster);
        if (foundServices.length > 0) {
            await this.scaleServicesToZero(cluster, foundServices);
        }
        const foundInstances = await this.getAllInstancesFor(cluster);
        if (foundInstances.length > 0) {
            await this.deregisterContainerInstances(cluster, foundInstances);
        }
        return new events_1.EventEmitter();
    }
    async getAllServicesFor(cluster) {
        try {
            const listServiceResponses = await Promise.all(this.launchTypes.map(l => this.ecs.listServices({ cluster, launchType: l }).promise()));
            return listServiceResponses.reduce((acc, r) => {
                return acc.concat(r.serviceArns);
            }, []);
        }
        catch (e) {
            console.log(e);
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
            console.log(e);
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
            console.log(e);
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
            console.log(e);
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
            console.log(e);
            return [];
        }
    }
}
exports.ECSClusterManager = ECSClusterManager;
