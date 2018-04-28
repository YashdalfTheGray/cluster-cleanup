/// <reference types="node" />
import * as ECS from 'aws-sdk/clients/ecs';
import { EventEmitter } from 'events';
export interface ECSClusterManagerConfig extends ECS.Types.ClientConfiguration {
    enableFargate?: boolean;
}
export declare class ECSClusterManager {
    launchTypes: ECS.Types.LaunchType[];
    private ecs;
    constructor(config?: ECSClusterManagerConfig);
    deleteClusterAndResources(clusterName: string): Promise<EventEmitter>;
    private getAllServicesFor(clusterName);
}
