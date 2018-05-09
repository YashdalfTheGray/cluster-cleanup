import { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import { ECSClusterManagerEventEmitter } from '.';
export interface ECSClusterManagerConfig extends ServiceConfigurationOptions {
    enableFargate?: boolean;
}
export declare class ECSClusterManager {
    private launchTypes;
    private ecs;
    private cloudFormation;
    constructor(config?: ECSClusterManagerConfig);
    deleteClusterAndResources(cluster: string): Promise<ECSClusterManagerEventEmitter>;
    private getAllServicesFor(cluster);
    private scaleServicesToZero(cluster, serviceArns);
    private getAllInstancesFor(cluster);
    private deregisterContainerInstances(cluster, instances);
    private deleteAllServices(cluster, services);
}
