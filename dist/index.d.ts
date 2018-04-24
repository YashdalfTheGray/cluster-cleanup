/// <reference types="node" />
import * as ECS from 'aws-sdk/clients/ecs';
import { EventEmitter } from 'events';
export declare class ECSClusterManager {
    private ecs;
    constructor(config?: ECS.Types.ClientConfiguration);
    deleteClusterAndResources(clusterName: string): Promise<EventEmitter>;
    private getAllServicesFor(clusterName);
}
