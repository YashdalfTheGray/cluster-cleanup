import { Stack, StackEvent } from '@aws-sdk/client-cloudformation';
import { Cluster, ContainerInstance, Service, Task } from '@aws-sdk/client-ecs';
import { Listener, RemoveListenerFunction } from './types';
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
    instancesDeregistered = "ClusterCleanup.instancesDeregistered",
    stackDeletionStarted = "ClusterCleanup.stackDeletionStarted",
    stackDeletionDone = "ClusterCleanup.stackDeletionDone",
    resourceDeleted = "ClusterCleanup.resourceDeleted",
    clusterDeleted = "ClusterCleanup.clusterDeleted"
}
export declare class ClusterCleanupEventEmitter {
    private events;
    verbose: boolean;
    constructor(verbose?: boolean);
    emit(event: ClusterCleanupEvents.start, cluster: string): boolean;
    emit(event: ClusterCleanupEvents.done, cluster: string): boolean;
    emit(event: ClusterCleanupEvents.doneWithError, err: Error): boolean;
    emit(event: ClusterCleanupEvents.error, err: Error): boolean;
    emit(event: ClusterCleanupEvents.stackFound, stack: Stack): boolean;
    emit(event: ClusterCleanupEvents.servicesFound, services: string[]): boolean;
    emit(event: ClusterCleanupEvents.servicesScaledDown, services: Service[]): boolean;
    emit(event: ClusterCleanupEvents.servicesDeleted, services: Service[]): boolean;
    emit(event: ClusterCleanupEvents.tasksFound, tasks: string[]): boolean;
    emit(event: ClusterCleanupEvents.tasksStopped, tasks: Task[]): boolean;
    emit(event: ClusterCleanupEvents.instancesFound, instances: string[]): boolean;
    emit(event: ClusterCleanupEvents.instancesDeregistered, instances: ContainerInstance[]): boolean;
    emit(event: ClusterCleanupEvents.stackDeletionStarted, stackId: string): boolean;
    emit(event: ClusterCleanupEvents.stackDeletionDone, stackId: string): boolean;
    emit(event: ClusterCleanupEvents.clusterDeleted, cluster: Cluster): boolean;
    emit(event: ClusterCleanupEvents.resourceDeleted, resource: StackEvent): boolean;
    on(event: ClusterCleanupEvents.start, l: Listener<string>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.done, l: Listener<string>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.doneWithError, l: Listener<Error>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.error, l: Listener<Error>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.stackFound, l: Listener<Stack>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.servicesFound, l: Listener<string[]>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.servicesScaledDown, l: Listener<Service[]>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.servicesDeleted, l: Listener<Service[]>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.tasksFound, l: Listener<string[]>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.tasksStopped, l: Listener<Task[]>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.instancesFound, l: Listener<string[]>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.instancesDeregistered, l: Listener<ContainerInstance[]>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.stackDeletionStarted, l: Listener<string>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.stackDeletionDone, l: Listener<string>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.clusterDeleted, l: Listener<Cluster>): RemoveListenerFunction;
    on(event: ClusterCleanupEvents.resourceDeleted, l: Listener<StackEvent>): RemoveListenerFunction;
    removeAllListeners(event?: string): ClusterCleanupEventEmitter;
}
