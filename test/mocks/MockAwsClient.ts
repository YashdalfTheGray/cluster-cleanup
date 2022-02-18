import {
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeClustersCommand,
  DescribeClustersCommandOutput,
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
  public send<I extends object>(command: I): Promise<MetadataBearer> {
    this.commandLogger(command);
    switch (command.constructor) {
      case DescribeClustersCommand:
        return Promise.resolve(this.mockDescribeClustersResponse());
      case DescribeStacksCommand:
        return Promise.resolve(this.mockDescribeStacksResponse());
      default:
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
}
