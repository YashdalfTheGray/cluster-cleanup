import { CloudFormation } from '@aws-sdk/client-cloudformation';
import { ECS } from '@aws-sdk/client-ecs';
import test from 'ava';

import { ClusterCleanup } from '../../src';
import { MockAwsClient } from '../mocks';

test('cleanup goes through all the motions', async (t) => {
  const seenCommands = [];
  const mockAwsClient = new MockAwsClient((command) => {
    seenCommands.push(command);
  });

  const cleanup = new ClusterCleanup(
    { enableFargate: true },
    mockAwsClient as unknown as ECS,
    mockAwsClient as unknown as CloudFormation
  );

  const cleanedUpResources = await cleanup.deleteClusterAndResources(
    'active-test-cluster',
    'test-stack',
    {
      verbose: false,
      pollTimeoutMs: 2000,
      pollIntervalMs: 100,
      polliMinDelayMs: 1000,
    }
  );

  t.deepEqual(
    seenCommands.map((c) => c.constructor.name),
    [
      'DescribeClustersCommand',
      'DescribeStacksCommand',
      'ListServicesCommand',
      'ListServicesCommand',
      'UpdateServiceCommand',
      'UpdateServiceCommand',
      'UpdateServiceCommand',
      'UpdateServiceCommand',
      'ListTasksCommand',
      'StopTaskCommand',
      'StopTaskCommand',
      'ListContainerInstancesCommand',
      'DeregisterContainerInstanceCommand',
      'DeregisterContainerInstanceCommand',
      'DeregisterContainerInstanceCommand',
      'DeregisterContainerInstanceCommand',
      'DeleteServiceCommand',
      'DeleteServiceCommand',
      'DeleteServiceCommand',
      'DeleteServiceCommand',
      'DeleteStackCommand',
      'DescribeStacksCommand',
      'DeleteClusterCommand',
    ]
  );
  t.deepEqual(cleanedUpResources, [
    'active:test:cluster:arn:ec2:task:arn-1',
    'active:test:cluster:arn:ec2:task:arn-2',
    'active:test:cluster:arn:container:instance:arn-1',
    'active:test:cluster:arn:container:instance:arn-2',
    'active:test:cluster:arn:container:instance:arn-3',
    'active:test:cluster:arn:container:instance:arn-4',
    'active:test:cluster:arn:fargate:service:arn-1',
    'active:test:cluster:arn:fargate:service:arn-2',
    'active:test:cluster:arn:ec2:service:arn-1',
    'active:test:cluster:arn:ec2:service:arn-2',
    'test-stack',
    'active-test-cluster',
  ]);
});
