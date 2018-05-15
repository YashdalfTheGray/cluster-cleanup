import { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import { ECSClusterManagerEventEmitter } from '.';
export interface ECSClusterManagerConfig extends ServiceConfigurationOptions {
    enableFargate?: boolean;
}
export interface DeleteOptions {
    verbose?: boolean;
    block?: boolean;
}
export declare class ECSClusterManager {
    private launchTypes;
    private ecs;
    private cloudFormation;
    constructor(config?: ECSClusterManagerConfig);
    deleteClusterAndResources(cluster: string, options?: DeleteOptions): ECSClusterManagerEventEmitter;
    private deleteHelper(cluster, events, options);
    private describeStack(cluster);
    private getAllServicesFor(cluster);
    private scaleServicesToZero(cluster, serviceArns);
    private getAllInstancesFor(cluster);
    private deregisterContainerInstances(cluster, instances);
    private deleteAllServices(cluster, services);
    private deleteStack(cluster);
    private pollCloudFormationForChanges(cluster);
}
