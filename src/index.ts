import * as ECS from 'aws-sdk/clients/ecs';
import { EventEmitter } from 'events';

export interface ECSClusterManagerConfig extends ECS.Types.ClientConfiguration {
    enableFargate?: boolean;
}

export class ECSClusterManager {
	launchTypes: ECS.Types.LaunchType[];
    private ecs: ECS;

    public constructor(config?: ECSClusterManagerConfig) {
        this.ecs = new ECS(config);
        this.launchTypes = ['EC2'];

        if (config.enableFargate) {
            this.launchTypes.push('FARGATE');
        }
    }

    public async deleteClusterAndResources(clusterName: string): Promise<EventEmitter> {
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

        const foundServices = await this.getAllServicesFor(clusterName);

        console.log(await this.scaleServicesToZero(clusterName, foundServices));

        return new EventEmitter();
    }

    private async getAllServicesFor(clusterName: string): Promise<string[]> {
        try {
            const listServiceResponses = await Promise.all(this.launchTypes.map(
                l => this.ecs.listServices({ cluster: clusterName, launchType: l }).promise()
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

    private async scaleServicesToZero(clusterName: string, serviceArns: string[]): Promise<ECS.Types.Services> {
        try {
            const scaleServiceResponses = await Promise.all(serviceArns.map(
                s => this.ecs.updateService({ cluster: clusterName, service: s, desiredCount: 0 }).promise()
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
}
