import * as ECS from 'aws-sdk/clients/ecs';
import { EventEmitter } from 'events';

export interface ECSClusterManagerConfig extends ECS.ClientConfiguration {
    enableFargate?: boolean;
}

export class ECSClusterManager {
	private launchTypes: ECS.LaunchType[];
    private ecs: ECS;

    public constructor(config?: ECSClusterManagerConfig) {
        this.ecs = new ECS(config);
        this.launchTypes = ['EC2'];

        if (config.enableFargate) {
            this.launchTypes.push('FARGATE');
        }
    }

    public async deleteClusterAndResources(cluster: string): Promise<EventEmitter> {
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

        return new EventEmitter();
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
        catch(e) {
            console.log(e);
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
        catch(e) {
            console.log(e);
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
            console.log(e);
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
            console.log(e);
            return [];
        }
    }
}
