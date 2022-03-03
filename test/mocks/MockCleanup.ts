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
} from '../../src';

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

    if (config.includeFargate) {
      this.launchTypes.push(LaunchType.FARGATE);
    }
  }

  public get eventEmitter() {
    return this.events;
  }

  public async deleteClusterAndResources(
    clusterName: string,
    stackName = `EC2ContainerService-${clusterName}`,
    options: Partial<MockDeleteOptions> = {}
  ): Promise<string[]> {
    this.events.verbose = options.verbose;

    return this.deleteHelper(clusterName, stackName, options);
  }

  private async deleteHelper(
    clusterName: string,
    stackName?: string,
    options: Partial<MockDeleteOptions> = {}
  ): Promise<string[]> {
    const cleanedUpResources = [];
    const { stack, stackEvents, services, containerInstances, tasks, cluster } =
      options.mock;

    let startTime: number;

    if (options.verbose) {
      startTime = Date.now();
    }

    this.events.emit(ClusterCleanupEvents.start, clusterName);
    this.events.emit(ClusterCleanupEvents.stackFound, stack);

    await this.randomFakeDelay(25, 50);

    if (services.length > 0) {
      this.events.emit(
        ClusterCleanupEvents.servicesFound,
        services.map((s) => s.serviceArn)
      );
      await this.randomFakeDelay(400, 500);
      this.events.emit(ClusterCleanupEvents.servicesScaledDown, services);
    }

    if (tasks.length > 0) {
      const taskIds = tasks.map((t) => t.taskArn);
      this.events.emit(ClusterCleanupEvents.tasksFound, taskIds);
      await this.randomFakeDelay(100, 500);
      cleanedUpResources.push(...taskIds);
      this.events.emit(ClusterCleanupEvents.tasksStopped, tasks);
    }

    if (containerInstances.length > 0) {
      const containerInstanceIds = containerInstances.map(
        (i) => i.containerInstanceArn
      );
      this.events.emit(
        ClusterCleanupEvents.instancesFound,
        containerInstanceIds
      );
      await this.randomFakeDelay(100, 1000);
      cleanedUpResources.push(...containerInstanceIds);
      this.events.emit(
        ClusterCleanupEvents.instancesDeregistered,
        containerInstances
      );
    }

    if (services.length > 0) {
      const serviceIds = services.map((s) => s.serviceArn);
      cleanedUpResources.push(...serviceIds);
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
          cleanedUpResources.push(e.PhysicalResourceId);
          await this.randomFakeDelay(100, 1000);
        });

        this.events.emit(ClusterCleanupEvents.stackDeletionDone, stack.StackId);
        cleanedUpResources.push(stack.StackId);

        await this.randomFakeDelay(400, 500);
        this.events.emit(ClusterCleanupEvents.clusterDeleted, cluster);
        this.events.emit(ClusterCleanupEvents.done, cluster.clusterName);
        cleanedUpResources.push(cluster.clusterArn);
      } catch (e) {
        this.events.emit(ClusterCleanupEvents.doneWithError, e);
        return;
      }
    } else {
      await this.randomFakeDelay(400, 500);
      this.events.emit(ClusterCleanupEvents.clusterDeleted, cluster);
      this.events.emit(ClusterCleanupEvents.done, cluster.clusterName);
      cleanedUpResources.push(cluster.clusterArn);
    }

    if (options.verbose) {
      console.log(
        `Deleting cluster ${cluster.clusterName} took ${
          (Date.now() - startTime) / 1000
        }s.`
      );
    }

    return cleanedUpResources;
  }

  private randomFakeDelay(min: number, max: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min);
    });
  }
}
