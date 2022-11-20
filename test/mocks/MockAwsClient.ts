import {
  DeleteStackCommand,
  DeleteStackCommandOutput,
  DescribeStackEventsCommand,
  DescribeStackEventsCommandOutput,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeClustersCommand,
  DescribeClustersCommandOutput,
  ListServicesCommand,
  ListServicesCommandOutput,
  LaunchType,
  UpdateServiceCommand,
  UpdateServiceCommandOutput,
  ListTasksCommand,
  ListTasksCommandOutput,
  StopTaskCommandOutput,
  StopTaskCommand,
  ListContainerInstancesCommandOutput,
  ListContainerInstancesCommand,
  DeregisterContainerInstanceCommandOutput,
  DeregisterContainerInstanceCommand,
  DeleteServiceCommand,
  DeleteServiceCommandOutput,
  DeleteClusterCommand,
  DeleteClusterCommandOutput,
} from '@aws-sdk/client-ecs';
import { MetadataBearer } from '@aws-sdk/types';

export class MockAwsClient {
  public constructor(
    private commandLogger: <E extends object>(command: E) => void
  ) {}

  public send(
    command: DescribeClustersCommand
  ): Promise<DescribeClustersCommandOutput>;
  public send(
    command: DescribeStacksCommand
  ): Promise<DescribeStacksCommandOutput>;
  public send(command: ListServicesCommand): Promise<ListServicesCommandOutput>;
  public send(
    command: UpdateServiceCommand
  ): Promise<UpdateServiceCommandOutput>;
  public send<I extends object>(command: I): Promise<MetadataBearer> {
    this.commandLogger(command);

    if (command instanceof DescribeClustersCommand) {
      return Promise.resolve(this.mockDescribeClustersResponse());
    } else if (command instanceof ListServicesCommand) {
      return Promise.resolve(this.mockListServicesResponse(command));
    } else if (command instanceof UpdateServiceCommand) {
      return Promise.resolve(this.mockUpdateServiceResponse(command));
    } else if (command instanceof DeleteServiceCommand) {
      return Promise.resolve(this.mockDeleteServiceResponse(command));
    } else if (command instanceof ListTasksCommand) {
      return Promise.resolve(this.mockListTasksResponse());
    } else if (command instanceof StopTaskCommand) {
      return Promise.resolve(this.mockStopTaskResponse(command));
    } else if (command instanceof ListContainerInstancesCommand) {
      return Promise.resolve(this.mockListContainerInstancesResponse());
    } else if (command instanceof DeregisterContainerInstanceCommand) {
      return Promise.resolve(
        this.mockDeregisterContainerInstanceResponse(command)
      );
    } else if (command instanceof DeleteClusterCommand) {
      return Promise.resolve(this.mockDeleteClusterResponse(command));
    } else if (command instanceof DescribeStacksCommand) {
      return Promise.resolve(this.mockDescribeStacksResponse(command));
    } else if (command instanceof DeleteStackCommand) {
      return Promise.resolve(this.mockDeleteStackResponse(command));
    } else if (command instanceof DescribeStackEventsCommand) {
      return Promise.resolve(this.mockDescribeStackEventsResponse());
    } else {
      return Promise.resolve({ $metadata: {} });
    }
  }

  private mockDescribeClustersResponse() {
    return {
      $metadata: {},
      clusters: [
        {
          clusterArn: 'active:test:cluster:arn',
          clusterName: 'active-test-cluster',
          status: 'ACTIVE',
        },
        {
          clusterArn: 'inactive:test:cluster:arn',
          clusterName: 'inactive-test-cluster',
          status: 'INACTIVE',
        },
      ],
    };
  }

  private mockListServicesResponse(
    command: ListServicesCommand
  ): ListServicesCommandOutput {
    switch (command.input.launchType) {
      case LaunchType.FARGATE:
        return {
          $metadata: {},
          serviceArns: [
            'active:test:cluster:arn:ec2:service:arn-1',
            'active:test:cluster:arn:ec2:service:arn-2',
          ],
        };
      case LaunchType.EC2:
        return {
          $metadata: {},
          serviceArns: [
            'active:test:cluster:arn:fargate:service:arn-1',
            'active:test:cluster:arn:fargate:service:arn-2',
          ],
        };
      default:
        throw new TypeError(
          `Unrecognized launch type ${command.input.launchType}`
        );
    }
  }

  private mockUpdateServiceResponse(
    command: UpdateServiceCommand
  ): UpdateServiceCommandOutput {
    return {
      $metadata: {},
      service: {
        serviceArn: command.input.service,
      },
    };
  }

  private mockDeleteServiceResponse(
    command: DeleteServiceCommand
  ): DeleteServiceCommandOutput {
    return {
      $metadata: {},
      service: {
        serviceArn: command.input.service,
      },
    };
  }

  private mockListTasksResponse(): ListTasksCommandOutput {
    return {
      $metadata: {},
      taskArns: [
        'active:test:cluster:arn:ec2:task:arn-1',
        'active:test:cluster:arn:ec2:task:arn-2',
      ],
    };
  }

  private mockStopTaskResponse(
    command: StopTaskCommand
  ): StopTaskCommandOutput {
    return {
      $metadata: {},
      task: {
        taskArn: command.input.task,
      },
    };
  }

  private mockListContainerInstancesResponse(): ListContainerInstancesCommandOutput {
    return {
      $metadata: {},
      containerInstanceArns: [
        'active:test:cluster:arn:container:instance:arn-1',
        'active:test:cluster:arn:container:instance:arn-2',
        'active:test:cluster:arn:container:instance:arn-3',
        'active:test:cluster:arn:container:instance:arn-4',
      ],
    };
  }

  private mockDeregisterContainerInstanceResponse(
    command: DeregisterContainerInstanceCommand
  ): DeregisterContainerInstanceCommandOutput {
    return {
      $metadata: {},
      containerInstance: {
        containerInstanceArn: command.input.containerInstance,
      },
    };
  }

  private mockDeleteClusterResponse(
    command: DeleteClusterCommand
  ): DeleteClusterCommandOutput {
    return {
      $metadata: {},
      cluster: {
        clusterArn: command.input.cluster,
      },
    };
  }

  private mockDescribeStacksResponse(
    command: DescribeStacksCommand
  ): DescribeStacksCommandOutput {
    return {
      $metadata: {},
      Stacks: [
        {
          StackName: 'test-stack',
          StackId: command.input.StackName,
          StackStatus: 'DELETE_COMPLETE',
          CreationTime: new Date(),
        },
      ],
    };
  }

  private mockDeleteStackResponse(
    command: DeleteStackCommand
  ): DeleteStackCommandOutput {
    return {
      $metadata: {},
    };
  }

  private mockDescribeStackEventsResponse(): DescribeStackEventsCommandOutput {
    return {
      $metadata: {},
      StackEvents: [
        {
          EventId: 'test-event-id',
          StackId: 'test:stack:arn',
          ResourceType: 'AWS::VPC',
          StackName: 'test-stack',
          Timestamp: new Date(),
          ResourceStatus: 'DELETE_IN_PROGRESS',
        },
        {
          EventId: 'test-event-id',
          StackId: 'test:stack:arn',
          ResourceType: 'AWS::EC2::AutoscalingGroup',
          StackName: 'test-stack',
          Timestamp: new Date(),
          ResourceStatus: 'DELETE_COMPLETE',
        },
        {
          EventId: 'test-event-id',
          StackId: 'test:stack:arn',
          ResourceType: 'AWS::VPC::SecurityGroup',
          StackName: 'test-stack',
          Timestamp: new Date(),
          ResourceStatus: 'DELETE_COMPLETE',
        },
        {
          EventId: 'test-event-id',
          StackId: 'test:stack:arn',
          ResourceType: 'AWS::VPC::Subnet',
          StackName: 'test-stack',
          Timestamp: new Date(),
          ResourceStatus: 'DELETE_COMPLETE',
        },
      ],
    };
  }
}
