import { EventEmitter } from 'events';
import { Types as ECSTypes } from 'aws-sdk/clients/ecs';
import { Types as CloudformationTypes } from 'aws-sdk/clients/cloudformation';

export type Listener<T> = (data: T) => void;
export type RemoveListenerFunction = () => void;

export enum ClusterCleanupEvents {
    start = 'ClusterCleanup.start',
    done = 'ClusterCleanup.done',
    doneWithError = 'ClusterCleanup.doneWithError',
    error = 'ClusterCleanup.error',
    stackFound = 'ClusterCleanup.stackFound',
    servicesFound = 'ClusterCleanup.servicesFound',
    servicesScaledDown = 'ClusterCleanup.servicesScaledDown',
    servicesDeleted = 'ClusterCleanup.servicesDeleted',
    tasksFound = 'ClusterCleanup.tasksFound',
    tasksStopped = 'ClusterCleanup.tasksStopped',
    instancesFound = 'ClusterCleanup.instancesFound',
    instancesDeregistered = 'ECSCluserManager.instancesDeregistered',
    stackDeletionStarted = 'ClusterCleanup.stackDeletionStarted',
    stackDeletionDone = 'ClusterCleanup.stackDeletionDone',
    resourceDeleted = 'ClusterCleanup.resourceDeleted',
    clusterDeleted = 'ClusterCleanup.clusterDeleted'
}

export class ClusterCleanupEventEmitter {
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

    public removeAllListeners(event?: string): ClusterCleanupEventEmitter {
        this.events.removeAllListeners(event);
        return this;
    }

    public onStart(l: Listener<string>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.start, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.start, l); };
    }

    public onStackFound(l: Listener<CloudformationTypes.Stack>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.stackFound, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.stackFound, l); };
    }

    public onServicesFound(l: Listener<string[]>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.servicesFound, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.servicesFound, l); };
    }

    public onServicesScaledDown(l: Listener<ECSTypes.Service[]>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.servicesScaledDown, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.servicesScaledDown, l); };
    }

    public onServicesDeleted(l: Listener<ECSTypes.Service[]>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.servicesDeleted, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.servicesDeleted, l); };
    }

    public onTasksFound(l: Listener<string[]>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.tasksFound, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.tasksFound, l); };
    }

    public onTasksStopped(l: Listener<ECSTypes.Task[]>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.tasksStopped, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.tasksStopped, l); };
    }

    public onInstancesFound(l: Listener<string[]>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.instancesFound, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.instancesFound, l); };
    }

    public onInstancesDeregistered(l: Listener<ECSTypes.ContainerInstance[]>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.instancesDeregistered, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.instancesDeregistered, l); };
    }

    public onStackDeletionStarted(l: Listener<string>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.stackDeletionStarted, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.stackDeletionStarted, l); };
    }

    public onStackDeletionDone(l: Listener<string>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.stackDeletionDone, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.stackDeletionDone, l); };
    }

    public onResourceDeleted(l: Listener<CloudformationTypes.StackEvent>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.resourceDeleted, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.resourceDeleted, l); };
    }

    public onClusterDeleted(l: Listener<ECSTypes.Cluster>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.clusterDeleted, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.clusterDeleted, l); };
    }

    public onDone(l: Listener<string>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.done, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.done, l); };
    }

    public onDoneWithError(l: Listener<Error>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.doneWithError, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.doneWithError, l); };
    }

    public onError(l: Listener<Error>): RemoveListenerFunction {
        this.events.addListener(ClusterCleanupEvents.error, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.error, l); };
    }
}
