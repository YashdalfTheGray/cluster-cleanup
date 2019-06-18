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
    private deleteHelper;
    private describeCluster;
    private doesClusterExist;
    private describeStack;
    private getAllServicesFor;
    private scaleServicesToZero;
    private getAllTasksFor;
    private stopTasks;
    private getAllInstancesFor;
    private deregisterContainerInstances;
    private deleteAllServices;
    private describeStackResources;
    private deleteStack;
    private describeStackEvents;
    private pollCloudFormationForChanges;
    private setupCloudFormationPolling;
    private deleteCluster;
}
