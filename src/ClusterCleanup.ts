import {
  CloudFormation,
  Stack,
  StackEvent,
  waitUntilStackDeleteComplete,
  DescribeStacksCommand,
  DeleteStackCommand,
  DescribeStackEventsCommand,
} from '@aws-sdk/client-cloudformation';
import {
  Cluster,
  ContainerInstance,
  ECS,
  LaunchType,
  Service,
  Task,
  DescribeClustersCommand,
  ListServicesCommand,
  UpdateServiceCommand,
  ListTasksCommand,
  StopTaskCommand,
  ListContainerInstancesCommand,
  DeregisterContainerInstanceCommand,
  DeleteServiceCommand,
  DeleteClusterCommand,
} from '@aws-sdk/client-ecs';
import { WaiterState } from '@aws-sdk/util-waiter';

import {
  ClusterCleanupEventEmitter,
  ClusterCleanupEvents,
  ClusterCleanupConfig,
  DeleteOptions,
} from '.';

export class ClusterCleanup {
  private TEN_MINUTES_IN_MS = 10 * 60 * 1000;
  private THIRTY_SECONDS_IN_MS = 30 * 1000;

  public constructor(
    config?: ClusterCleanupConfig,
    private ecs: ECS = new ECS(config),
    private cloudFormation = new CloudFormation(config),
    private events = new ClusterCleanupEventEmitter(),
    private launchTypes = [LaunchType.EC2].concat(
      config.includeFargate ? [LaunchType.FARGATE] : []
    )
  ) {}

  public get eventEmitter() {
    return this.events;
  }

  public async deleteClusterAndResources(
    clusterName: string,
    stackName = `EC2ContainerService-${clusterName}`,
    options: DeleteOptions = {
      verbose: false,
      waiterTimeoutMs: this.TEN_MINUTES_IN_MS,
      waiterPollMinDelayMs: this.THIRTY_SECONDS_IN_MS,
      stackEventsPollIntervalMs: this.THIRTY_SECONDS_IN_MS,
    }
  ): Promise<string[]> {
    this.events.verbose = options.verbose;

    return this.deleteHelper(clusterName, stackName, options);
  }

  private async deleteHelper(
    clusterName: string,
    stackName?: string,
    options: DeleteOptions = {}
  ): Promise<string[]> {
    const cleanedUpResources = [];

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
    let startTime: number;

    if (options.verbose) {
      startTime = Date.now();
    }

    this.events.emit(ClusterCleanupEvents.start, clusterName);

    if (!(await this.doesClusterExist(clusterName))) {
      this.events.emit(
        ClusterCleanupEvents.doneWithError,
        new Error(
          `Cluster ${clusterName} does not exist in the region specified`
        )
      );
      return [];
    }

    let services: Service[];
    let instances: ContainerInstance[];
    let tasks: Task[];

    const stack = await this.describeStack(clusterName, stackName);
    if (stack) {
      this.events.emit(ClusterCleanupEvents.stackFound, stack);
    }

    const foundServices = await this.getAllServicesFor(clusterName);
    if (foundServices.length > 0) {
      this.events.emit(ClusterCleanupEvents.servicesFound, foundServices);
      services = await this.scaleServicesToZero(clusterName, foundServices);
      this.events.emit(ClusterCleanupEvents.servicesScaledDown, services);
    }

    const foundTasks = await this.getAllTasksFor(clusterName);
    if (foundTasks.length > 0) {
      this.events.emit(ClusterCleanupEvents.tasksFound, foundTasks);
      tasks = await this.stopTasks(clusterName, foundTasks);
      this.events.emit(ClusterCleanupEvents.tasksStopped, tasks);
      cleanedUpResources.push(...tasks.map((t) => t.taskArn));
    }

    const foundInstances = await this.getAllInstancesFor(clusterName);
    if (foundInstances.length > 0) {
      this.events.emit(ClusterCleanupEvents.instancesFound, foundInstances);
      instances = await this.deregisterContainerInstances(
        clusterName,
        foundInstances
      );
      this.events.emit(ClusterCleanupEvents.instancesDeregistered, instances);
      cleanedUpResources.push(...instances.map((i) => i.containerInstanceArn));
    }

    if (foundServices.length > 0) {
      await this.deleteAllServices(
        clusterName,
        services.map((s) => s.serviceName)
      );
      this.events.emit(ClusterCleanupEvents.servicesDeleted, services);
      cleanedUpResources.push(...services.map((s) => s.serviceArn));
    }

    if (stack) {
      await this.deleteStack(clusterName);
      this.events.emit(
        ClusterCleanupEvents.stackDeletionStarted,
        stack.StackId
      );

      try {
        const pollTimer = this.setupCloudFormationPolling(
          clusterName,
          options.stackEventsPollIntervalMs,
          cleanedUpResources
        );

        const result = await this.waitForStackDeletion(
          stack,
          options.waiterTimeoutMs,
          options.waiterPollMinDelayMs
        );

        if (result.state !== WaiterState.SUCCESS) {
          clearInterval(pollTimer);
          throw new Error(result.reason);
        }

        this.events.emit(ClusterCleanupEvents.stackDeletionDone, stack.StackId);
        cleanedUpResources.push(stack.StackId);
        clearInterval(pollTimer);

        const deletedCluster = await this.deleteCluster(clusterName);
        this.events.emit(ClusterCleanupEvents.clusterDeleted, deletedCluster);
        cleanedUpResources.push(deletedCluster.clusterArn);
        this.events.emit(ClusterCleanupEvents.done, clusterName);
      } catch (e) {
        this.events.emit(ClusterCleanupEvents.doneWithError, e);
        return [];
      }
    } else {
      const deletedCluster = await this.deleteCluster(clusterName);
      this.events.emit(ClusterCleanupEvents.clusterDeleted, deletedCluster);
      cleanedUpResources.push(deletedCluster.clusterArn);
      this.events.emit(ClusterCleanupEvents.done, clusterName);
    }

    if (options.verbose) {
      console.log(
        `Deleting cluster ${clusterName} took ${
          (Date.now() - startTime) / 1000
        }s.`
      );
    }

    return cleanedUpResources;
  }

  private async describeCluster(clusterName: string): Promise<Cluster[]> {
    try {
      const command = new DescribeClustersCommand({ clusters: [clusterName] });
      const response = await this.ecs.send(command);
      return response.clusters;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async doesClusterExist(clusterName: string): Promise<boolean> {
    try {
      const clusters = await this.describeCluster(clusterName);
      return (
        clusters
          .filter(({ status }) => status !== 'INACTIVE')
          .filter(({ clusterName }) => clusterName === clusterName).length !== 0
      );
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return false;
    }
  }

  private async describeStack(
    clusterName: string,
    stackName: string
  ): Promise<Stack> {
    try {
      const command = new DescribeStacksCommand({
        StackName: stackName || `EC2ContainerService-${clusterName}`,
      });
      const describeStackResponse = await this.cloudFormation.send(command);
      return describeStackResponse.Stacks[0];
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return null;
    }
  }

  private async getAllServicesFor(clusterName: string): Promise<string[]> {
    try {
      const listServiceResponses = await Promise.all(
        this.launchTypes.map((l) =>
          this.ecs.send(
            new ListServicesCommand({ cluster: clusterName, launchType: l })
          )
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
    clusterName: string,
    serviceArns: string[]
  ): Promise<Service[]> {
    try {
      const scaleServiceResponses = await Promise.all(
        serviceArns.map((s) =>
          this.ecs.send(
            new UpdateServiceCommand({
              cluster: clusterName,
              service: s,
              desiredCount: 0,
            })
          )
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

  private async getAllTasksFor(clusterName: string): Promise<string[]> {
    try {
      const command = new ListTasksCommand({ cluster: clusterName });
      const listTasksResponse = await this.ecs.send(command);
      return listTasksResponse.taskArns;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async stopTasks(
    clusterName: string,
    taskArns: string[]
  ): Promise<Task[]> {
    try {
      const reason = 'Cluster being deleted';
      const stopTaskResponses = await Promise.all(
        taskArns.map((task) =>
          this.ecs.send(
            new StopTaskCommand({ task, cluster: clusterName, reason })
          )
        )
      );
      return stopTaskResponses.map((r) => r.task);
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async getAllInstancesFor(clusterName: string): Promise<string[]> {
    try {
      const listInstanceResponse = await this.ecs.send(
        new ListContainerInstancesCommand({ cluster: clusterName })
      );

      return listInstanceResponse.containerInstanceArns;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async deregisterContainerInstances(
    clusterName: string,
    instances: string[]
  ): Promise<ContainerInstance[]> {
    try {
      const deregisterResponses = await Promise.all(
        instances.map((i) =>
          this.ecs.send(
            new DeregisterContainerInstanceCommand({
              cluster: clusterName,
              containerInstance: i,
              force: true,
            })
          )
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
    clusterName: string,
    serviceNames: string[]
  ): Promise<Service[]> {
    try {
      const deleteServicesResponses = await Promise.all(
        serviceNames.map((service) =>
          this.ecs.send(
            new DeleteServiceCommand({ cluster: clusterName, service })
          )
        )
      );

      return deleteServicesResponses.reduce((acc, r) => {
        return acc.concat(r.service);
      }, []);
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async deleteStack(clusterName: string): Promise<Object> {
    try {
      const deleteStackResponse = await this.cloudFormation.send(
        new DeleteStackCommand({
          StackName: `EC2ContainerService-${clusterName}`,
        })
      );

      return deleteStackResponse;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return e;
    }
  }

  private async describeStackEvents(
    clusterName: string
  ): Promise<StackEvent[]> {
    try {
      const describeStackEventsResponse = await this.cloudFormation.send(
        new DescribeStackEventsCommand({
          StackName: `EC2ContainerService-${clusterName}`,
        })
      );

      return describeStackEventsResponse.StackEvents;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.error, e);
      return [];
    }
  }

  private async waitForStackDeletion(
    stack: Stack,
    pollTimeoutInMs: number,
    pollMinDelayMs: number
  ): ReturnType<typeof waitUntilStackDeleteComplete> {
    const waiterResult = await waitUntilStackDeleteComplete(
      {
        client: this.cloudFormation,
        maxWaitTime: Math.round(pollTimeoutInMs / 1000),
        minDelay: Math.round(pollMinDelayMs / 1000),
      },
      { StackName: stack.StackId }
    );
    return waiterResult;
  }

  private setupCloudFormationPolling(
    clusterName: string,
    pollIntervalInMs: number,
    collector = []
  ): NodeJS.Timer {
    const alreadyDeleted = [];

    const pollEvent = async () => {
      try {
        const stackEvents = (await this.describeStackEvents(clusterName)) || [];
        stackEvents
          .filter((e) => e.ResourceStatus === 'DELETE_COMPLETE')
          .filter((e) => !alreadyDeleted.includes(e.LogicalResourceId))
          .forEach((e) => {
            alreadyDeleted.push(e.LogicalResourceId);
            collector.push(e.PhysicalResourceId);
            this.events.emit(ClusterCleanupEvents.resourceDeleted, e);
          });
      } catch (e) {
        this.events.emit(ClusterCleanupEvents.error, e);
      }
    };

    return setInterval(pollEvent, pollIntervalInMs);
  }

  private async deleteCluster(clusterName: string): Promise<Cluster> {
    try {
      const response = await this.ecs.send(
        new DeleteClusterCommand({ cluster: clusterName })
      );
      return response.cluster;
    } catch (e) {
      this.events.emit(ClusterCleanupEvents.doneWithError, e);
    }
  }
}
