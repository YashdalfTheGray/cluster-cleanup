import { EventEmitter } from 'events';
import { Types as ECSTypes } from 'aws-sdk/clients/ecs';
import { Types as CloudformationTypes } from 'aws-sdk/clients/cloudformation';

export type Listener<T> = (data: T) => () => void;

export enum ClusterManagerEvents {
    servicesFound = 'ECSClusterManager.servicesFound',
    servicesScaledDown = 'ECSClusterManager.servicesScaledDown',
    servicesDeleted = 'ECSClusterManager.servicesDeleted',
    instancesFound = 'ECSClusterManager.instancesFound',
    instancesDeregistered = 'ECSCluserManager.instancesDeregistered',
    stackDeletionStarted = 'ECSClusterManager.stackDeletionStarted',
    resourceDeleted = 'ECSClusterManager.resourceDeleted'
}

export class ECSClusterManagerEventEmitter {
    events: EventEmitter;

    public constructor() {
        this.events = new EventEmitter();
    }

    public emit(event: string, data: any): boolean {
        return this.events.emit(event, data);
    }

    public removeAllListeners(event?: string): ECSClusterManagerEventEmitter {
        this.events.removeAllListeners(event);
        return this;
    }

    public onServicesFound(l: Listener<string[]>) {
        return this.events.addListener(ClusterManagerEvents.servicesFound, l);
    }

    public onServicesScaledDown(l: Listener<ECSTypes.Service[]>) {
        return this.events.addListener(ClusterManagerEvents.servicesScaledDown, l);
    }
}