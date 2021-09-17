import { Stack, StackEvent } from '@aws-sdk/client-cloudformation';
import { Cluster, ContainerInstance, Service, Task } from '@aws-sdk/client-ecs';
export declare type Listener<T> = (data: T) => void;
export declare type RemoveListenerFunction = () => void;
export declare enum ClusterCleanupEvents {
    start = "ClusterCleanup.start",
    done = "ClusterCleanup.done",
    doneWithError = "ClusterCleanup.doneWithError",
    error = "ClusterCleanup.error",
    stackFound = "ClusterCleanup.stackFound",
    servicesFound = "ClusterCleanup.servicesFound",
    servicesScaledDown = "ClusterCleanup.servicesScaledDown",
    servicesDeleted = "ClusterCleanup.servicesDeleted",
    tasksFound = "ClusterCleanup.tasksFound",
    tasksStopped = "ClusterCleanup.tasksStopped",
    instancesFound = "ClusterCleanup.instancesFound",
    instancesDeregistered = "ECSCluserManager.instancesDeregistered",
    stackDeletionStarted = "ClusterCleanup.stackDeletionStarted",
    stackDeletionDone = "ClusterCleanup.stackDeletionDone",
    resourceDeleted = "ClusterCleanup.resourceDeleted",
    clusterDeleted = "ClusterCleanup.clusterDeleted"
}
export declare class ClusterCleanupEventEmitter {
    private events;
    verbose: boolean;
    constructor(verbose?: boolean);
    emit(event: string, ...data: any[]): boolean;
    removeAllListeners(event?: string): ClusterCleanupEventEmitter;
    onStart(l: Listener<string>): RemoveListenerFunction;
    onStackFound(l: Listener<Stack>): RemoveListenerFunction;
    onServicesFound(l: Listener<string[]>): RemoveListenerFunction;
    onServicesScaledDown(l: Listener<Service[]>): RemoveListenerFunction;
    onServicesDeleted(l: Listener<Service[]>): RemoveListenerFunction;
    onTasksFound(l: Listener<string[]>): RemoveListenerFunction;
    onTasksStopped(l: Listener<Task[]>): RemoveListenerFunction;
    onInstancesFound(l: Listener<string[]>): RemoveListenerFunction;
    onInstancesDeregistered(l: Listener<ContainerInstance[]>): RemoveListenerFunction;
    onStackDeletionStarted(l: Listener<string>): RemoveListenerFunction;
    onStackDeletionDone(l: Listener<string>): RemoveListenerFunction;
    onResourceDeleted(l: Listener<StackEvent>): RemoveListenerFunction;
    onClusterDeleted(l: Listener<Cluster>): RemoveListenerFunction;
    onDone(l: Listener<string>): RemoveListenerFunction;
    onDoneWithError(l: Listener<Error>): RemoveListenerFunction;
    onError(l: Listener<Error>): RemoveListenerFunction;
}
