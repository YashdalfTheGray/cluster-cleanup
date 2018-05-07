import { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import { ECSClusterManagerEvents } from '.';
export interface ECSClusterManagerConfig extends ServiceConfigurationOptions {
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
