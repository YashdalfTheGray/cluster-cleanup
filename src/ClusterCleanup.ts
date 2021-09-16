import {
  CloudFormation,
  Stack,
  StackEvent,
  StackResource,
  waitUntilStackDeleteComplete,
} from '@aws-sdk/client-cloudformation';
import {
  Cluster,
  ContainerInstance,
  ECS,
  ECSClientConfig,
  LaunchType,
  Service,
  Task,
} from '@aws-sdk/client-ecs';
import { ClusterCleanupEventEmitter, ClusterCleanupEvents } from '.';

export interface ClusterCleanupConfig extends ECSClientConfig {
  enableFargate?: boolean;
}

export interface DeleteOptions {
  verbose?: boolean;
}

export class ClusterCleanup {
  private launchTypes: LaunchType[];
  private ecs: ECS;
  private cloudFormation: CloudFormation;
  private events: ClusterCleanupEventEmitter;

  public constructor(config?: ClusterCleanupConfig) {
    this.ecs = new ECS(config);
    this.cloudFormation = new CloudFormation(config);
    this.launchTypes = [LaunchType.EC2];
    this.events = new ClusterCleanupEventEmitter();

    if (config.enableFargate) {
      this.launchTypes.push(LaunchType.FARGATE);
    }
  }

  public deleteClusterAndResources(
    cluster: string,
    options: DeleteOptions = {}
  ): ClusterCleanupEventEmitter {
    this.events.verbose = options.verbose;

    setImmediate(this.deleteHelper.bind(this), cluster, options);

    return this.events;
  }

  private async deleteHelper(cluster: string, options: DeleteOptions) {
    // 1. find CloudFormation stack
    // 2. find all services
    // 3. batch scale all services down to 0
    // 4. find all container instances
    // 5. deregister all container instances
    // 6. find all services, again
    // 7. delete all services
    // 8. delete CloudFormation stack
    // 9. poll CloudFormation until stack deleted
    // 10. delete cluster
    let startTime;

    if (options.verbose) {
      startTime = Date.now();
    }

    this.events.emit(ClusterCleanupEvents.start, cluster);

    if (!(await this.doesClusterExist(cluster))) {
      this.events.emit(
        ClusterCleanupEvents.doneWithError,
        new Error(`Cluster ${cluster} does not exist in the region specified`)
      );
      return;
    }

    let services: Service[];
    let instances: ContainerInstance[];
    let tasks: Task[];

    const stack = await this.describeStack(cluster);
    if (stack) {
      this.events.emit(ClusterCleanupEvents.stackFound, stack);
    }

    const foundServices = await this.getAllServicesFor(cluster);
    if (foundServices.length > 0) {
      this.events.emit(ClusterCleanupEvents.servicesFound, foundServices);
      services = await this.scaleServicesToZero(cluster, foundServices);
      this.events.emit(ClusterCleanupEvents.servicesScaledDown, services);
    }

    const foundTasks = await this.getAllTasksFor(cluster);
    if (foundTasks.length > 0) {
      this.events.emit(ClusterCleanupEvents.tasksFound, foundTasks);
      tasks = await this.stopTasks(cluster, foundTasks);
      this.events.emit(ClusterCleanupEvents.tasksStopped, tasks);
    }

    const foundInstances = await this.getAllInstancesFor(cluster);
    if (foundInstances.length > 0) {
      this.events.emit(ClusterCleanupEvents.instancesFound, foundInstances);
      instances = await this.deregisterContainerInstances(
        cluster,
        foundInstances
      );
      this.events.emit(ClusterCleanupEvents.instancesDeregistered, instances);
    }

    if (foundServices.length > 0) {
      await this.deleteAllServices(
        cluster,
        services.map((s) => s.serviceName)
      );
      this.events.emit(ClusterCleanupEvents.servicesDeleted, services);
    }

    if (stack) {
      await this.deleteStack(cluster);
      this.events.emit(
        ClusterCleanupEvents.stackDeletionStarted,
        stack.StackId
      );

      try {
        await this.pollCloudFormationForChanges(cluster, stack);
        this.events.emit(ClusterCleanupEvents.stackDeletionDone, stack.StackId);

        const deletedCluster = await this.deleteCluster(cluster);
        this.events.emit(ClusterCleanupEvents.clusterDeleted, deletedCluster);
        this.events.emit(ClusterCleanupEvents.done, cluster);
      } catch (e) {
        this.events.emit(ClusterCleanupEvents.doneWithError, e);
        return;
      }
    } else {
      const deletedCluster = await this.deleteCluster(cluster);
      this.events.emit(ClusterCleanupEvents.clusterDeleted, deletedCluster);
      this.events.emit(ClusterCleanupEvents.done, cluster);
    }

    if (options.verbose) {
      console.log(
        `Deleting cluster ${cluster} took ${(Date.now() - startTime) / 1000}s.`
      );
    }
  }

  private async describeCluster(cluster: string): Promise<Cluster[]> {
    try {
      const response = await this.ecs.describeClusters({ clusters: [cluster] });
      return response.clusters;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async doesClusterExist(cluster: string): Promise<boolean> {
    try {
      const clusters = await this.describeCluster(cluster);
      return (
        clusters
          .filter(({ status }) => status !== 'INACTIVE')
          .filter(({ clusterName }) => clusterName === cluster).length !== 0
      );
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return false;
    }
  }

  private async describeStack(cluster: string): Promise<Stack> {
    try {
      const describeStackResponse = await this.cloudFormation.describeStacks({
        StackName: `EC2ContainerService-${cluster}`,
      });

      return describeStackResponse.Stacks[0];
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return null;
    }
  }

  private async getAllServicesFor(cluster: string): Promise<string[]> {
    try {
      const listServiceResponses = await Promise.all(
        this.launchTypes.map((l) =>
          this.ecs.listServices({ cluster, launchType: l })
        )
      );

      return listServiceResponses.reduce((acc, r) => {
        return acc.concat(r.serviceArns);
      }, []);
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async scaleServicesToZero(
    cluster: string,
    serviceArns: string[]
  ): Promise<Service[]> {
    try {
      const scaleServiceResponses = await Promise.all(
        serviceArns.map((s) =>
          this.ecs.updateService({ cluster, service: s, desiredCount: 0 })
        )
      );

      return scaleServiceResponses.reduce((acc, r) => {
        return acc.concat(r.service);
      }, []);
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async getAllTasksFor(cluster: string): Promise<string[]> {
    try {
      const listTasksResponse = await this.ecs.listTasks({ cluster });
      return listTasksResponse.taskArns;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async stopTasks(
    cluster: string,
    taskArns: string[]
  ): Promise<Task[]> {
    try {
      const reason = 'Cluster being deleted';
      const stopTaskResponses = await Promise.all(
        taskArns.map((task) => this.ecs.stopTask({ task, cluster, reason }))
      );
      return stopTaskResponses.map((r) => r.task);
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async getAllInstancesFor(cluster: string): Promise<string[]> {
    try {
      const listInstanceResponse = await this.ecs.listContainerInstances({
        cluster,
      });

      return listInstanceResponse.containerInstanceArns;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async deregisterContainerInstances(
    cluster: string,
    instances: string[]
  ): Promise<ContainerInstance[]> {
    try {
      const deregisterResponses = await Promise.all(
        instances.map((i) =>
          this.ecs.deregisterContainerInstance({
            cluster,
            containerInstance: i,
            force: true,
          })
        )
      );

      return deregisterResponses.reduce((acc, r) => {
        return acc.concat(r.containerInstance);
      }, []);
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async deleteAllServices(
    cluster: string,
    services: string[]
  ): Promise<Service[]> {
    try {
      const deleteServicesResponses = await Promise.all(
        services.map((service) => this.ecs.deleteService({ cluster, service }))
      );

      return deleteServicesResponses.reduce((acc, r) => {
        return acc.concat(r.service);
      }, []);
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async describeStackResources(
    stackId: string,
    resourceId: string
  ): Promise<StackResource[]> {
    try {
      const describeResourceResponse =
        await this.cloudFormation.describeStackResources({
          StackName: stackId,
          LogicalResourceId: resourceId,
        });

      return describeResourceResponse.StackResources;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async deleteStack(cluster: string): Promise<Object> {
    try {
      const deleteStackResponse = await this.cloudFormation.deleteStack({
        StackName: `EC2ContainerService-${cluster}`,
      });

      return deleteStackResponse;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return e;
    }
  }

  private async describeStackEvents(cluster: string): Promise<StackEvent[]> {
    try {
      const describeStackEventsResponse =
        await this.cloudFormation.describeStackEvents({
          StackName: `EC2ContainerService-${cluster}`,
        });

      return describeStackEventsResponse.StackEvents;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async pollCloudFormationForChanges(
    cluster: string,
    stack: Stack
  ): ReturnType<typeof waitUntilStackDeleteComplete> {
    const TEN_MINUTES = 10 * 60;
    const pollTimer = this.setupCloudFormationPolling(cluster);

    const waiterResult = await waitUntilStackDeleteComplete(
      { client: this.cloudFormation, maxWaitTime: TEN_MINUTES },
      { StackName: stack.StackId }
    );
    clearInterval(pollTimer);
    return waiterResult;
  }

  private setupCloudFormationPolling(cluster: string): NodeJS.Timer {
    const TEN_SECONDS = 10 * 1000;
    const alreadyDeleted = [];

    const pollEvent = async () => {
      try {
        const stackEvents = (await this.describeStackEvents(cluster)) || [];
        stackEvents
          .filter((e) => e.ResourceStatus === 'DELETE_COMPLETE')
          .filter((e) => !alreadyDeleted.includes(e.LogicalResourceId))
          .forEach((e) => {
            alreadyDeleted.push(e.LogicalResourceId);
            this.events.emit(ClusterCleanupEvents.resourceDeleted, e);
          });
      } catch (e) {
        this.events.emit(ClusterCleanupEvents.error, e);
      }
    };

    return setInterval(pollEvent, TEN_SECONDS);
  }

  private async deleteCluster(cluster: string): Promise<Cluster> {
    try {
      const response = await this.ecs.deleteCluster({ cluster });
      return response.cluster;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.doneWithError, e);
    }
  }
}
