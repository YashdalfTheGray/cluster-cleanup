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
        console.log(await this.getAllServicesFor(clusterName));
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
}
exports.ECSClusterManager = ECSClusterManager;
