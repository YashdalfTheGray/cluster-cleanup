import test from 'ava';

import { ClusterCleanupEvents } from '../../src';
import { MockCleanup } from '../mocks';

test('cleanup events are fired as expected', async (t) => {
  const NOT_VERBOSE = 0;

  const mockCleanup = new MockCleanup({});
  const eventEmitter = mockCleanup.eventEmitter;
  const seenEvents = new Set();

  Object.keys(ClusterCleanupEvents).forEach((e) => {
    const event = ClusterCleanupEvents[e];
    eventEmitter.on(event, (_) => {
      seenEvents.add(e);
    });
  });

  const cleanedUpResources = await mockCleanup.deleteClusterAndResources(
    'test-cluster',
    'test-stack',
    NOT_VERBOSE,
    {
      mock: {
        stack: {
          StackId: 'test-stack-arn',
          StackName: 'test-stack',
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: new Date(),
        },
        stackEvents: [
          {
            EventId: 'vpc-event',
            StackId: 'test-stack-arn',
            StackName: 'test-stack',
            PhysicalResourceId: 'test-vpc-arn',
            Timestamp: new Date(),
          },
          {
            EventId: 'subnet-event',
            StackId: 'test-stack-arn',
            StackName: 'test-stack',
            PhysicalResourceId: 'test-subnet-arn',
            Timestamp: new Date(),
          },
          {
            EventId: 'security-group-event',
            StackId: 'test-stack-arn',
            StackName: 'test-stack',
            PhysicalResourceId: 'test-security-group-arn',
            Timestamp: new Date(),
          },
          {
            EventId: 'auto-scaling-group-event',
            StackId: 'test-stack-arn',
            StackName: 'test-stack',
            PhysicalResourceId: 'test-auto-scaling-group-arn',
            Timestamp: new Date(),
          },
        ],
        services: [
          { serviceArn: 'test-service-1-arn' },
          { serviceArn: 'test-service-2-arn' },
        ],
        containerInstances: [
          { containerInstanceArn: 'test-container-instance-1-arn' },
          { containerInstanceArn: 'test-container-instance-2-arn' },
        ],
        tasks: [
          { taskArn: 'test-task-1-arn' },
          { taskArn: 'test-task-2-arn' },
          { taskArn: 'test-task-3-arn' },
        ],
        cluster: {
          clusterName: 'test-cluster',
          clusterArn: 'test-cluster-arn',
        },
      },
    }
  );

  eventEmitter.on(ClusterCleanupEvents.done, (_) => {
    console.log(seenEvents);
    t.not(seenEvents.size, 0);
  });

  [
    'start',
    'stackFound',
    'servicesFound',
    'servicesScaledDown',
    'tasksFound',
    'tasksStopped',
    'instancesFound',
    'instancesDeregistered',
    'servicesDeleted',
    'stackDeletionStarted',
    'resourceDeleted',
    'stackDeletionDone',
    'clusterDeleted',
    'done',
  ].forEach((e) => {
    t.is(seenEvents.has(e), true);
  });

  [
    'test-task-1-arn',
    'test-task-2-arn',
    'test-task-3-arn',
    'test-container-instance-1-arn',
    'test-container-instance-2-arn',
    'test-service-1-arn',
    'test-service-2-arn',
    'test-vpc-arn',
    'test-subnet-arn',
    'test-security-group-arn',
    'test-auto-scaling-group-arn',
    'test-stack-arn',
    'test-cluster-arn',
  ].forEach((e) => {
    t.is(cleanedUpResources.includes(e), true);
  });
});
