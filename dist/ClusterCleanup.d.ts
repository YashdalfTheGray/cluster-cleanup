import { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import { ClusterCleanupEventEmitter } from '.';
export interface ClusterCleanupConfig extends ServiceConfigurationOptions {
    enableFargate?: boolean;
}
export interface DeleteOptions {
    verbose?: boolean;
}
export declare class ClusterCleanup {
    private launchTypes;
    private ecs;
    private cloudFormation;
    private events;
    constructor(config?: ClusterCleanupConfig);
    deleteClusterAndResources(cluster: string, options?: DeleteOptions): ClusterCleanupEventEmitter;
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
