"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS = require("aws-sdk/clients/ecs");
const events_1 = require("events");
class ECSClusterManager {
    constructor(config) {
        this.ecs = new ECS(config);
    }
    async deleteClusterAndResources(clusterName) {
        await this.getAllServicesFor(clusterName);
        return new events_1.EventEmitter();
    }
    async getAllServicesFor(clusterName) {
        try {
            const ec2ServicesResponse = await this.ecs.listServices({
                cluster: clusterName,
                launchType: 'EC2'
            }).promise();
            console.log(ec2ServicesResponse);
            return ['some-services'];
        }
        catch (e) {
            console.log(e);
            return [];
        }
    }
}
exports.ECSClusterManager = ECSClusterManager;
