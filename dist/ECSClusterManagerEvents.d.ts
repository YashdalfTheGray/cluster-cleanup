/// <reference types="node" />
import { EventEmitter } from 'events';
import { Types as ECSTypes } from 'aws-sdk/clients/ecs';
import { Types as CloudformationTypes } from 'aws-sdk/clients/cloudformation';
export declare type Listener<T> = (data: T) => void;
export declare type RemoveListenerFunction = () => void;
export declare enum ClusterManagerEvents {
    start = "ECSClusterManager.start",
    done = "ECSClusterManager.done",
    stackFound = "ECSClusterManager.stackFound",
    servicesFound = "ECSClusterManager.servicesFound",
    servicesScaledDown = "ECSClusterManager.servicesScaledDown",
    servicesDeleted = "ECSClusterManager.servicesDeleted",
    instancesFound = "ECSClusterManager.instancesFound",
    instancesDeregistered = "ECSCluserManager.instancesDeregistered",
    stackDeletionStarted = "ECSClusterManager.stackDeletionStarted",
    resourceDeleted = "ECSClusterManager.resourceDeleted",
    clusterDeleted = "ECSClusterManager.clusterDeleted",
}
export declare class ECSClusterManagerEventEmitter {
    events: EventEmitter;
    verbose: boolean;
    constructor(verbose?: boolean);
    emit(event: string, ...data: any[]): boolean;
    removeAllListeners(event?: string): ECSClusterManagerEventEmitter;
    onStackFound(l: Listener<CloudformationTypes.Stack>): RemoveListenerFunction;
    onServicesFound(l: Listener<string[]>): RemoveListenerFunction;
    onServicesScaledDown(l: Listener<ECSTypes.Service[]>): RemoveListenerFunction;
    onInstancesFound(l: Listener<string[]>): RemoveListenerFunction;
    onInstancesDeregistered(l: Listener<ECSTypes.ContainerInstance[]>): RemoveListenerFunction;
}
