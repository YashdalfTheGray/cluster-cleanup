import * as ECS from 'aws-sdk/clients/ecs';

export class ECSClusterManager {
    public constructor(config?: ECS.Types.ClientConfiguration) {
        console.log('Configuring ECSClusterManager');
    }
}
