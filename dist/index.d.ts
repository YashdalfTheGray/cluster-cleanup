/// <reference types="node" />
import * as ECS from 'aws-sdk/clients/ecs';
import { EventEmitter } from 'events';
export interface ECSClusterManagerConfig extends ECS.ClientConfiguration {
    enableFargate?: boolean;
}
export declare class ECSClusterManager {
    private launchTypes;
    private ecs;
    constructor(config?: ECSClusterManagerConfig);
    deleteClusterAndResources(cluster: string): Promise<EventEmitter>;
    private getAllServicesFor(cluster);
    private scaleServicesToZero(cluster, serviceArns);
    private getAllInstancesFor(cluster);
    private deregisterContainerInstances(cluster, instances);
}
