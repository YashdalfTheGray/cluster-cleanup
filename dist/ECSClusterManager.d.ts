import { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import { ECSClusterManagerEventEmitter } from '.';
export interface ECSClusterManagerConfig extends ServiceConfigurationOptions {
    enableFargate?: boolean;
}
export interface DeleteOptions {
    verbose?: boolean;
}
export declare class ECSClusterManager {
    private launchTypes;
    private ecs;
    private cloudFormation;
    private events;
    constructor(config?: ECSClusterManagerConfig);
    deleteClusterAndResources(cluster: string, options?: DeleteOptions): ECSClusterManagerEventEmitter;
    private deleteHelper(cluster, options);
    private describeCluster(cluster);
    private doesClusterExist(cluster);
    private describeStack(cluster);
    private getAllServicesFor(cluster);
    private scaleServicesToZero(cluster, serviceArns);
    private getAllInstancesFor(cluster);
    private deregisterContainerInstances(cluster, instances);
    private deleteAllServices(cluster, services);
    private describeStackResources(stackId, resourceId);
    private deleteStack(cluster);
    private describeStackEvents(cluster);
    private pollCloudFormationForChanges(cluster, stack);
    private setupCloudFormationPolling(cluster);
    private deleteCluster(cluster);
}
