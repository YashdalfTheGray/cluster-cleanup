import { CloudFormation } from '@aws-sdk/client-cloudformation';
import { ECS } from '@aws-sdk/client-ecs';
import test from 'ava';

import { ClusterCleanup } from '../../src';
import { MockAWSClient } from '../mocks';

test.skip('cleanup goes through all the motions', async (t) => {
  const cleanup = new ClusterCleanup(
    { enableFargate: true },
    {} as ECS,
    {} as CloudFormation
  );
});
