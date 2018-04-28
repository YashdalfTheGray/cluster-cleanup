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
        await this.getAllServicesFor(clusterName);

        return new EventEmitter();
    }

    private async getAllServicesFor(clusterName: string): Promise<ECS.Types.Services> {
        try {
            const listServiceResponses = await Promise.all(this.launchTypes.map(
                l => this.ecs.listServices({ cluster: clusterName, launchType: l }).promise()
            ));

            console.log(listServiceResponses);

            return ['some-services'] as ECS.Types.Services;
        }
        catch(e) {
            console.log(e);
            return [];
        }
    }
}
