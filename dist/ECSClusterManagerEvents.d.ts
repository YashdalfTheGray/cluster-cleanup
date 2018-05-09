/// <reference types="node" />
import { EventEmitter } from 'events';
import { Types as ECSTypes } from 'aws-sdk/clients/ecs';
export declare type Listener<T> = (data: T) => () => void;
export declare enum ClusterManagerEvents {
    servicesFound = "ECSClusterManager.servicesFound",
    servicesScaledDown = "ECSClusterManager.servicesScaledDown",
    servicesDeleted = "ECSClusterManager.servicesDeleted",
    instancesFound = "ECSClusterManager.instancesFound",
    instancesDeregistered = "ECSCluserManager.instancesDeregistered",
    stackDeletionStarted = "ECSClusterManager.stackDeletionStarted",
    resourceDeleted = "ECSClusterManager.resourceDeleted",
}
export declare class ECSClusterManagerEventEmitter {
    events: EventEmitter;
    constructor();
    emit(event: string, data: any): boolean;
    removeAllListeners(event?: string): ECSClusterManagerEventEmitter;
    onServicesFound(l: Listener<string[]>): EventEmitter;
    onServicesScaledDown(l: Listener<ECSTypes.Service[]>): EventEmitter;
}
