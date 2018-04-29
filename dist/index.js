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
    async deleteClusterAndResources(clusterName) {
        const foundServices = await this.getAllServicesFor(clusterName);
        console.log(await this.scaleServicesToZero(clusterName, foundServices));
        return new events_1.EventEmitter();
    }
    async getAllServicesFor(clusterName) {
        try {
            const listServiceResponses = await Promise.all(this.launchTypes.map(l => this.ecs.listServices({ cluster: clusterName, launchType: l }).promise()));
            return listServiceResponses.reduce((acc, r) => {
                return acc.concat(r.serviceArns);
            }, []);
        }
        catch (e) {
            console.log(e);
            return [];
        }
    }
    async scaleServicesToZero(clusterName, serviceArns) {
        try {
            const scaleServiceResponses = await Promise.all(serviceArns.map(s => this.ecs.updateService({ cluster: clusterName, service: s, desiredCount: 0 }).promise()));
            console.log(scaleServiceResponses);
            return scaleServiceResponses.reduce((acc, r) => {
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
