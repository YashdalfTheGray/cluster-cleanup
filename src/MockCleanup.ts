import { Stack, StackEvent } from '@aws-sdk/client-cloudformation';
import {
  LaunchType,
  Service,
  ContainerInstance,
  Task,
  Cluster,
} from '@aws-sdk/client-ecs';
import {
  ClusterCleanupConfig,
  ClusterCleanupEventEmitter,
  ClusterCleanupEvents,
  DeleteOptions,
} from '.';

export interface MockDeleteOptions extends DeleteOptions {
  mock: {
    stack: Stack;
    stackEvents: StackEvent[];
    services: Service[];
    containerInstances: ContainerInstance[];
    tasks: Task[];
    cluster: Cluster;
  };
}

export class MockCleanup {
  private launchTypes: LaunchType[];
  private events: ClusterCleanupEventEmitter;

  public constructor(config?: ClusterCleanupConfig) {
    this.launchTypes = [LaunchType.EC2];
    this.events = new ClusterCleanupEventEmitter();

    if (config.enableFargate) {
      this.launchTypes.push(LaunchType.FARGATE);
    }
  }

  public get eventEmitter() {
    return this.events;
  }

  public deleteClusterAndResources(
    clusterName: string,
    options: Partial<MockDeleteOptions> = {}
  ): ClusterCleanupEventEmitter {
    this.events.verbose = options.verbose;

    setImmediate(this.deleteHelper.bind(this), clusterName, options);

    return this.events;
  }

  private async deleteHelper(
    clusterName: string,
    stackName?: string,
    options: Partial<MockDeleteOptions> = {}
  ) {
    const { stack, stackEvents, services, containerInstances, tasks, cluster } =
      options.mock;

    let startTime: number;

    if (options.verbose) {
      startTime = Date.now();
    }

    this.events.emit(ClusterCleanupEvents.start, cluster.clusterName);
    this.events.emit(ClusterCleanupEvents.stackFound, stack);

    await this.randomFakeDelay(25, 50);

    if (services.length > 0) {
      this.events.emit(
        ClusterCleanupEvents.servicesFound,
        services.map((s) => s.serviceName)
      );
      await this.randomFakeDelay(400, 500);
      this.events.emit(ClusterCleanupEvents.servicesScaledDown, services);
    }

    if (tasks.length > 0) {
      this.events.emit(
        ClusterCleanupEvents.tasksFound,
        tasks.map((t) => t.taskArn)
      );
      await this.randomFakeDelay(100, 500);
      this.events.emit(ClusterCleanupEvents.tasksStopped, tasks);
    }

    if (containerInstances.length > 0) {
      this.events.emit(
        ClusterCleanupEvents.instancesFound,
        containerInstances.map((i) => i.containerInstanceArn)
      );
      await this.randomFakeDelay(100, 1000);
      this.events.emit(
        ClusterCleanupEvents.instancesDeregistered,
        containerInstances
      );
    }

    if (services.length > 0) {
      await this.randomFakeDelay(25, 100);
      this.events.emit(ClusterCleanupEvents.servicesDeleted, services);
    }

    if (stack) {
      await this.randomFakeDelay(25, 100);
      this.events.emit(
        ClusterCleanupEvents.stackDeletionStarted,
        stack.StackId
      );

      try {
        await this.randomFakeDelay(250, 1000);

        stackEvents.forEach(async (e) => {
          this.events.emit(ClusterCleanupEvents.resourceDeleted, e);
          await this.randomFakeDelay(100, 1000);
        });

        this.events.emit(ClusterCleanupEvents.stackDeletionDone, stack.StackId);

        await this.randomFakeDelay(400, 500);
        this.events.emit(ClusterCleanupEvents.clusterDeleted, cluster);
        this.events.emit(ClusterCleanupEvents.done, cluster.clusterName);
      } catch (e) {
        this.events.emit(ClusterCleanupEvents.doneWithError, e);
        return;
      }
    } else {
      await this.randomFakeDelay(400, 500);
      this.events.emit(ClusterCleanupEvents.clusterDeleted, cluster);
      this.events.emit(ClusterCleanupEvents.done, cluster.clusterName);
    }

    if (options.verbose) {
      console.log(
        `Deleting cluster ${cluster} took ${(Date.now() - startTime) / 1000}s.`
      );
    }
  }

  private async pollCloudFormationForChanges(
    cluster: string,
    stack: Stack,
    events: StackEvent[]
  ) {}

  private fakeDelay(millis: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, millis);
    });
  }

  private randomFakeDelay(min: number, max: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min);
    });
  }
}
