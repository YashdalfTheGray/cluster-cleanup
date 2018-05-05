import * as ECS from 'aws-sdk/clients/ecs';
import { ECSClusterManagerEvents } from '.';
export interface ECSClusterManagerConfig extends ECS.ClientConfiguration {
    enableFargate?: boolean;
}
export declare class ECSClusterManager {
    private launchTypes;
    private ecs;
    private cloudFormation;
    constructor(config?: ECSClusterManagerConfig);
    deleteClusterAndResources(cluster: string): Promise<ECSClusterManagerEvents>;
    private getAllServicesFor(cluster);
    private scaleServicesToZero(cluster, serviceArns);
    private getAllInstancesFor(cluster);
    private deregisterContainerInstances(cluster, instances);
    private deleteAllServices(cluster, services);
}
