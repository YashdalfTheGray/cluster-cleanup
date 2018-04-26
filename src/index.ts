import * as ECS from 'aws-sdk/clients/ecs';
import { EventEmitter } from 'events';

export class ECSClusterManager {
    private ecs: ECS;

    public constructor(config?: ECS.Types.ClientConfiguration) {
        this.ecs = new ECS(config);
    }

    public async deleteClusterAndResources(clusterName: string): Promise<EventEmitter> {
        await this.getAllServicesFor(clusterName);

        return new EventEmitter();
    }

    private async getAllServicesFor(clusterName: string): Promise<ECS.Types.Services> {
        try {
            const ec2ServicesResponse = await this.ecs.listServices({
                cluster: clusterName,
                launchType: 'EC2'
            }).promise();

            console.log(ec2ServicesResponse);

            return ['some-services'] as ECS.Types.Services;
        }
        catch(e) {
            console.log(e);
            return [];
        }
    }
}
