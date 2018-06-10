import { Types as ECSTypes } from 'aws-sdk/clients/ecs';
import { Types as CloudformationTypes } from 'aws-sdk/clients/cloudformation';
export declare type Listener<T> = (data: T) => void;
export declare type RemoveListenerFunction = () => void;
export declare enum ClusterCleanupEvents {
    start = "ClusterCleanup.start",
    done = "ClusterCleanup.done",
    error = "ClusterCleanup.error",
    stackFound = "ClusterCleanup.stackFound",
    servicesFound = "ClusterCleanup.servicesFound",
    servicesScaledDown = "ClusterCleanup.servicesScaledDown",
    servicesDeleted = "ClusterCleanup.servicesDeleted",
    instancesFound = "ClusterCleanup.instancesFound",
    instancesDeregistered = "ECSCluserManager.instancesDeregistered",
    stackDeletionStarted = "ClusterCleanup.stackDeletionStarted",
    stackDeletionDone = "ClusterCleanup.stackDeletionDone",
    resourceDeleted = "ClusterCleanup.resourceDeleted",
    clusterDeleted = "ClusterCleanup.clusterDeleted",
}
export declare class ClusterCleanupEventEmitter {
    private events;
    verbose: boolean;
    constructor(verbose?: boolean);
    emit(event: string, ...data: any[]): boolean;
    removeAllListeners(event?: string): ClusterCleanupEventEmitter;
    onStart(l: Listener<string>): RemoveListenerFunction;
    onStackFound(l: Listener<CloudformationTypes.Stack>): RemoveListenerFunction;
    onServicesFound(l: Listener<string[]>): RemoveListenerFunction;
    onServicesScaledDown(l: Listener<ECSTypes.Service[]>): RemoveListenerFunction;
    onInstancesFound(l: Listener<string[]>): RemoveListenerFunction;
    onInstancesDeregistered(l: Listener<ECSTypes.ContainerInstance[]>): RemoveListenerFunction;
    onStackDeletionStarted(l: Listener<string>): RemoveListenerFunction;
    onStackDeletionDone(l: Listener<string>): RemoveListenerFunction;
    onResourceDeleted(l: Listener<CloudformationTypes.StackEvent>): RemoveListenerFunction;
    onClusterDeleted(l: Listener<ECSTypes.Cluster>): RemoveListenerFunction;
    onDone(l: Listener<string>): RemoveListenerFunction;
    onError(l: Listener<Error>): RemoveListenerFunction;
}
