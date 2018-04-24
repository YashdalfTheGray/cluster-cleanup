import * as ECS from 'aws-sdk/clients/ecs';
import { EventEmitter } from 'events';

export class ECSClusterManager {
    private ecs: ECS;

    public constructor(config?: ECS.Types.ClientConfiguration) {
        this.ecs = new ECS(config);
    }

    public async deleteClusterAndResources(clusterName: string): Promise<EventEmitter> {
        const servicesResponse = await this.ecs.listServices({
            cluster: clusterName,
            launchType: 'EC2'
        }).promise();

        return new EventEmitter();
    }

    private async getAllServicesFor(clusterName: string): Promise<ECS.Types.Services> {
        return [];
    }
}
