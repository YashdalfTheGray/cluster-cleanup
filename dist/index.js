"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS = require("aws-sdk/clients/ecs");
const events_1 = require("events");
class ECSClusterManager {
    constructor(config) {
        this.ecs = new ECS(config);
    }
    async deleteClusterAndResources(clusterName) {
        const servicesResponse = await this.ecs.listServices({
            cluster: clusterName,
            launchType: 'EC2'
        }).promise();
        return new events_1.EventEmitter();
    }
    async getAllServicesFor(clusterName) {
        return [];
    }
}
exports.ECSClusterManager = ECSClusterManager;
