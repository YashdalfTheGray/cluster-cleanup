import {
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
    } else if (command instanceof DescribeStacksCommand) {
      return Promise.resolve(this.mockDescribeStacksResponse());
    } else if (command instanceof ListServicesCommand) {
      return Promise.resolve(this.mockListServicesResponse(command));
    } else if (command instanceof UpdateServiceCommand) {
      return Promise.resolve(this.mockUpdateServiceResponse(command));
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

  private mockDescribeStacksResponse(): DescribeStacksCommandOutput {
    return {
      $metadata: {},
      Stacks: [
        {
          StackName: 'test-stack',
          StackId: 'test:stack:arn',
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: new Date(),
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
}
