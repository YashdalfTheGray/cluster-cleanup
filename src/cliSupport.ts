import { ClusterCleanup, ClusterCleanupConfig, ClusterCleanupEvents } from '.';

export function setupCleanerWithConfig(
  config: ClusterCleanupConfig,
  verbose = true
): ClusterCleanup {
  const cleaner = new ClusterCleanup(config);

  cleaner.eventEmitter.on(ClusterCleanupEvents.doneWithError, (e) => {
    console.error(e);
    process.exit(1);
  });

  cleaner.eventEmitter.on(ClusterCleanupEvents.error, (e) => {
    console.error(e);
  });

  cleaner.eventEmitter.on(ClusterCleanupEvents.start, (clusterName) =>
    console.log(`Starting cleanup of cluster ${clusterName}`)
  );

  cleaner.eventEmitter.on(ClusterCleanupEvents.done, (cluster) => {
    console.log(`Successfully cleaned up resources for cluster ${cluster}`);
  });

  if (verbose) {
    cleaner.eventEmitter.on(ClusterCleanupEvents.stackFound, (stack) => {
      console.log(`Found stack for cluster by name ${stack.StackName}`);
    });

    cleaner.eventEmitter.on(ClusterCleanupEvents.servicesFound, (services) => {
      console.log('Found the following services');
      console.log(services.join('\n'));
    });

    cleaner.eventEmitter.on(
      ClusterCleanupEvents.servicesScaledDown,
      (services) => {
        console.log('Scaled down the following services to 0');
        console.log(services.map((s) => s.serviceName).join('\n'));
      }
    );

    cleaner.eventEmitter.on(ClusterCleanupEvents.tasksFound, (tasks) => {
      console.log('Found the following tasks');
      console.log(tasks.join('\n'));
    });

    cleaner.eventEmitter.on(ClusterCleanupEvents.tasksStopped, (tasks) => {
      console.log('Stopped the following tasks');
      console.log(tasks.map((t) => t.taskArn).join('\n'));
    });

    cleaner.eventEmitter.on(
      ClusterCleanupEvents.instancesFound,
      (instances) => {
        console.log('Found the following instances');
        console.log(instances.join('\n'));
      }
    );

    cleaner.eventEmitter.on(
      ClusterCleanupEvents.instancesDeregistered,
      (instances) => {
        console.log('Deregistered the following instances');
        console.log(instances.map((i) => i.containerInstanceArn).join('\n'));
      }
    );

    cleaner.eventEmitter.on(
      ClusterCleanupEvents.servicesDeleted,
      (services) => {
        console.log('Deleted the following services');
        console.log(services.map((s) => s.serviceName).join('\n'));
      }
    );

    cleaner.eventEmitter.on(
      ClusterCleanupEvents.stackDeletionStarted,
      (stackId) => {
        console.log(`Started deleting stack with id ${stackId}`);
      }
    );

    cleaner.eventEmitter.on(
      ClusterCleanupEvents.resourceDeleted,
      (resource) => {
        console.log(
          `Deleted ${resource.ResourceType} ${resource.PhysicalResourceId}`
        );
      }
    );

    cleaner.eventEmitter.on(
      ClusterCleanupEvents.stackDeletionDone,
      (stackId) => {
        console.log(`Deleted stack with id ${stackId}`);
      }
    );

    cleaner.eventEmitter.on(ClusterCleanupEvents.clusterDeleted, (cluster) => {
      console.log(`Successfully deleted cluster called ${cluster}`);
    });
  }

  process.on('exit', () => {
    cleaner.eventEmitter.removeAllListeners();
  });

  return cleaner;
}
