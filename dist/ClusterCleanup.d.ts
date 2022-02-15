import { ClusterCleanupEventEmitter, ClusterCleanupConfig, DeleteOptions } from '.';
export declare class ClusterCleanup {
    private launchTypes;
    private ecs;
    private cloudFormation;
    private events;
    constructor(config?: ClusterCleanupConfig);
    get eventEmitter(): ClusterCleanupEventEmitter;
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
