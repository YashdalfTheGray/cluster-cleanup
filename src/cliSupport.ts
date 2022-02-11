import { ClusterCleanup, ClusterCleanupConfig } from '.';

export function setupCleanerWithConfig(
  config: ClusterCleanupConfig,
  verbose = true
): ClusterCleanup {
  const cleaner = new ClusterCleanup(config);

  cleaner.eventEmitter.onDoneWithError((e) => {
    console.error(e);
    process.exit(1);
  });

  cleaner.eventEmitter.onError((e) => {
    console.error(e);
  });

  cleaner.eventEmitter.onStart((clusterName) =>
    console.log(`Starting cleanup of cluster ${clusterName}`)
  );

  cleaner.eventEmitter.onDone((cluster) => {
    console.log(`Successfully cleaned up resources for cluster ${cluster}`);
  });

  if (verbose) {
    cleaner.eventEmitter.onStackFound((stack) => {
      console.log(`Found stack for cluster by name ${stack.StackName}`);
    });

    cleaner.eventEmitter.onServicesFound((services) => {
      console.log('Found the following services');
      console.log(services.join('\n'));
    });

    cleaner.eventEmitter.onServicesScaledDown((services) => {
      console.log('Scaled down the following services to 0');
      console.log(services.map((s) => s.serviceName).join('\n'));
    });

    cleaner.eventEmitter.onTasksFound((tasks) => {
      console.log('Found the following tasks');
      console.log(tasks.join('\n'));
    });

    cleaner.eventEmitter.onTasksStopped((tasks) => {
      console.log('Stopped the following tasks');
      console.log(tasks.map((t) => t.taskArn).join('\n'));
    });

    cleaner.eventEmitter.onInstancesFound((instances) => {
      console.log('Found the following instances');
      console.log(instances.join('\n'));
    });

    cleaner.eventEmitter.onInstancesDeregistered((instances) => {
      console.log('Deregistered the following instances');
      console.log(instances.map((i) => i.containerInstanceArn).join('\n'));
    });

    cleaner.eventEmitter.onServicesDeleted((services) => {
      console.log('Deleted the following services');
      console.log(services.map((s) => s.serviceName).join('\n'));
    });

    cleaner.eventEmitter.onStackDeletionStarted((stackId) => {
      console.log(`Started deleting stack with id ${stackId}`);
    });

    cleaner.eventEmitter.onResourceDeleted((resource) => {
      console.log(
        `Deleted ${resource.ResourceType} ${resource.PhysicalResourceId}`
      );
    });

    cleaner.eventEmitter.onStackDeletionDone((stackId) => {
      console.log(`Deleted stack with id ${stackId}`);
    });

    cleaner.eventEmitter.onClusterDeleted((cluster) => {
      console.log(`Successfully deleted cluster called ${cluster}`);
    });
  }

  process.on('exit', () => {
    cleaner.eventEmitter.removeAllListeners();
  });

  return cleaner;
}