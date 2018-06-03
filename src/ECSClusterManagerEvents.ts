import { EventEmitter } from 'events';
import { Types as ECSTypes } from 'aws-sdk/clients/ecs';
import { Types as CloudformationTypes } from 'aws-sdk/clients/cloudformation';

export type Listener<T> = (data: T) => void;
export type RemoveListenerFunction = () => void;

export enum ClusterManagerEvents {
    start = 'ECSClusterManager.start',
    done = 'ECSClusterManager.done',
    error = 'ECSClusterManager.error',
    stackFound = 'ECSClusterManager.stackFound',
    servicesFound = 'ECSClusterManager.servicesFound',
    servicesScaledDown = 'ECSClusterManager.servicesScaledDown',
    servicesDeleted = 'ECSClusterManager.servicesDeleted',
    instancesFound = 'ECSClusterManager.instancesFound',
    instancesDeregistered = 'ECSCluserManager.instancesDeregistered',
    stackDeletionStarted = 'ECSClusterManager.stackDeletionStarted',
    stackDeletionDone = 'ECSClusterManager.stackDeletionDone',
    resourceDeleted = 'ECSClusterManager.resourceDeleted',
    clusterDeleted = 'ECSClusterManager.clusterDeleted'
}

export class ECSClusterManagerEventEmitter {
    private events: EventEmitter;
    verbose: boolean;

    public constructor(verbose: boolean = false) {
        this.events = new EventEmitter();
        this.verbose = verbose;
    }

    public emit(event: string, ...data: any[]): boolean {
        if (this.verbose) {
            console.log(`Emitting event ${event}`);
        }
        return this.events.emit(event, ...data);
    }

    public removeAllListeners(event?: string): ECSClusterManagerEventEmitter {
        this.events.removeAllListeners(event);
        return this;
    }

    public onStart(l: Listener<string>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.start, l);
        return () => { this.events.removeListener(ClusterManagerEvents.start, l); };
    }

    public onStackFound(l: Listener<CloudformationTypes.Stack>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.stackFound, l);
        return () => { this.events.removeListener(ClusterManagerEvents.stackFound, l); };
    }

    public onServicesFound(l: Listener<string[]>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.servicesFound, l);
        return () => { this.events.removeListener(ClusterManagerEvents.servicesFound, l); };
    }

    public onServicesScaledDown(l: Listener<ECSTypes.Service[]>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.servicesScaledDown, l);
        return () => { this.events.removeListener(ClusterManagerEvents.servicesScaledDown, l); };
    }

    public onInstancesFound(l: Listener<string[]>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.instancesFound, l);
        return () => { this.events.removeListener(ClusterManagerEvents.instancesFound, l); };
    }

    public onInstancesDeregistered(l: Listener<ECSTypes.ContainerInstance[]>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.instancesDeregistered, l);
        return () => { this.events.removeListener(ClusterManagerEvents.instancesDeregistered, l); };
    }

    public onStackDeletionStarted(l: Listener<string>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.stackDeletionStarted, l);
        return () => { this.events.removeListener(ClusterManagerEvents.stackDeletionStarted, l); };
    }

    public onStackDeletionDone(l: Listener<string>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.stackDeletionDone, l);
        return () => { this.events.removeListener(ClusterManagerEvents.stackDeletionDone, l); };
    }

    public onClusterDeleted(l: Listener<ECSTypes.Cluster>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.clusterDeleted, l);
        return () => { this.events.removeListener(ClusterManagerEvents.clusterDeleted, l); };
    }

    public onDone(l: Listener<string>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.done, l);
        return () => { this.events.removeListener(ClusterManagerEvents.done, l); };
    }

    public onError(l: Listener<Error>): RemoveListenerFunction {
        this.events.addListener(ClusterManagerEvents.error, l);
        return () => { this.events.removeListener(ClusterManagerEvents.error, l); };
    }
}