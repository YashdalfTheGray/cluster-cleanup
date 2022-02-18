import { CloudFormation } from '@aws-sdk/client-cloudformation';
import { ECS } from '@aws-sdk/client-ecs';
import test from 'ava';

import { ClusterCleanup } from '../../src';
import { MockAwsClient } from '../mocks';

test.failing('cleanup goes through all the motions', async (t) => {
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
      verbose: true,
      pollTimeoutMs: 1000,
      pollIntervalMs: 100,
    }
  );

  t.not(seenCommands.length, 0);
  t.not(cleanedUpResources.length, 0);
});
