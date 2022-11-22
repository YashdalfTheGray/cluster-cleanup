import { EventEmitter } from 'events';

import * as chalk from 'chalk';
import { Stack, StackEvent } from '@aws-sdk/client-cloudformation';
import { Cluster, ContainerInstance, Service, Task } from '@aws-sdk/client-ecs';

import { Listener, RemoveListenerFunction } from './types';

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
  instancesDeregistered = 'ClusterCleanup.instancesDeregistered',
  stackDeletionStarted = 'ClusterCleanup.stackDeletionStarted',
  stackDeletionDone = 'ClusterCleanup.stackDeletionDone',
  resourceDeleted = 'ClusterCleanup.resourceDeleted',
  clusterDeleted = 'ClusterCleanup.clusterDeleted',
}

export class ClusterCleanupEventEmitter {
  private events: EventEmitter;
  verbose: number;

  public constructor(verbose = 0) {
    this.events = new EventEmitter();
    this.verbose = verbose;
  }

  public emit(event: ClusterCleanupEvents.start, cluster: string): boolean;
  public emit(event: ClusterCleanupEvents.done, cluster: string): boolean;
  public emit(event: ClusterCleanupEvents.doneWithError, err: Error): boolean;
  public emit(event: ClusterCleanupEvents.error, err: Error): boolean;
  public emit(event: ClusterCleanupEvents.stackFound, stack: Stack): boolean;
  public emit(
    event: ClusterCleanupEvents.servicesFound,
    services: string[]
  ): boolean;
  public emit(
    event: ClusterCleanupEvents.servicesScaledDown,
    services: Service[]
  ): boolean;
  public emit(
    event: ClusterCleanupEvents.servicesDeleted,
    services: Service[]
  ): boolean;
  public emit(event: ClusterCleanupEvents.tasksFound, tasks: string[]): boolean;
  public emit(event: ClusterCleanupEvents.tasksStopped, tasks: Task[]): boolean;
  public emit(
    event: ClusterCleanupEvents.instancesFound,
    instances: string[]
  ): boolean;
  public emit(
    event: ClusterCleanupEvents.instancesDeregistered,
    instances: ContainerInstance[]
  ): boolean;
  public emit(
    event: ClusterCleanupEvents.stackDeletionStarted,
    stackId: string
  ): boolean;
  public emit(
    event: ClusterCleanupEvents.stackDeletionDone,
    stackId: string
  ): boolean;
  public emit(
    event: ClusterCleanupEvents.clusterDeleted,
    cluster: Cluster
  ): boolean;
  public emit(
    event: ClusterCleanupEvents.resourceDeleted,
    resource: StackEvent
  ): boolean;
  public emit<E extends ClusterCleanupEvents, D extends unknown[]>(
    event: E,
    ...data: D
  ): boolean {
    if (this.verbose >= 2) {
      console.log(chalk.dim(`[ClusterCLeanupEvents] Emitting event ${event}`));
    }
    return this.events.emit(event, ...data);
  }

  public on(
    event: ClusterCleanupEvents.start,
    l: Listener<string>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.done,
    l: Listener<string>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.doneWithError,
    l: Listener<Error>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.error,
    l: Listener<Error>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.stackFound,
    l: Listener<Stack>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.servicesFound,
    l: Listener<string[]>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.servicesScaledDown,
    l: Listener<Service[]>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.servicesDeleted,
    l: Listener<Service[]>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.tasksFound,
    l: Listener<string[]>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.tasksStopped,
    l: Listener<Task[]>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.instancesFound,
    l: Listener<string[]>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.instancesDeregistered,
    l: Listener<ContainerInstance[]>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.stackDeletionStarted,
    l: Listener<string>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.stackDeletionDone,
    l: Listener<string>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.clusterDeleted,
    l: Listener<Cluster>
  ): RemoveListenerFunction;
  public on(
    event: ClusterCleanupEvents.resourceDeleted,
    l: Listener<StackEvent>
  ): RemoveListenerFunction;
  public on<E extends ClusterCleanupEvents, D extends unknown[]>(
    event: E,
    l: Listener<D>
  ): RemoveListenerFunction {
    this.events.addListener(event, l);
    return () => {
      this.events.removeListener(event, l);
    };
  }

  public removeAllListeners(event?: string): ClusterCleanupEventEmitter {
    this.events.removeAllListeners(event);
    return this;
  }
}
