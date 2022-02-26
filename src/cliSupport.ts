import * as chalk from 'chalk';

import { ClusterCleanup, ClusterCleanupEvents } from '.';

export function decorateClusterCleanup(
  instance: ClusterCleanup,
  verbose = true
) {
  instance.eventEmitter.on(ClusterCleanupEvents.doneWithError, (e) => {
    console.log(chalk.red(e.message));
    console.error(e);
    process.exit(1);
  });

  instance.eventEmitter.on(ClusterCleanupEvents.error, (e) => {
    console.log(chalk.red(e.message));
    console.error(e);
  });

  instance.eventEmitter.on(ClusterCleanupEvents.start, (clusterName) =>
    console.log(`Starting cleanup of cluster ${chalk.cyan(clusterName)}`)
  );

  instance.eventEmitter.on(ClusterCleanupEvents.done, (clusterName) => {
    console.log(
      `${chalk.green(
        'Successfully'
      )} cleaned up resources for cluster ${chalk.cyan(clusterName)}`
    );
  });

  if (verbose) {
    instance.eventEmitter.on(ClusterCleanupEvents.stackFound, (stack) => {
      console.log(
        `Found stack for cluster by name ${chalk.cyan(stack.StackName)}`
      );
    });

    instance.eventEmitter.on(ClusterCleanupEvents.servicesFound, (services) => {
      console.log('Found the following services');
      console.log(chalk.cyan(services.join('\n')));
    });

    instance.eventEmitter.on(
      ClusterCleanupEvents.servicesScaledDown,
      (services) => {
        console.log('Scaled down the following services to 0');
        console.log(chalk.cyan(services.map((s) => s.serviceArn).join('\n')));
      }
    );

    instance.eventEmitter.on(ClusterCleanupEvents.tasksFound, (tasks) => {
      console.log('Found the following tasks');
      console.log(chalk.cyan(tasks.join('\n')));
    });

    instance.eventEmitter.on(ClusterCleanupEvents.tasksStopped, (tasks) => {
      console.log('Stopped the following tasks');
      console.log(chalk.cyan(tasks.map((t) => t.taskArn).join('\n')));
    });

    instance.eventEmitter.on(
      ClusterCleanupEvents.instancesFound,
      (instances) => {
        console.log('Found the following instances');
        console.log(chalk.cyan(instances.join('\n')));
      }
    );

    instance.eventEmitter.on(
      ClusterCleanupEvents.instancesDeregistered,
      (instances) => {
        console.log('Deregistered the following instances');
        console.log(
          chalk.cyan(instances.map((i) => i.containerInstanceArn).join('\n'))
        );
      }
    );

    instance.eventEmitter.on(
      ClusterCleanupEvents.servicesDeleted,
      (services) => {
        console.log('Deleted the following services');
        console.log(chalk.cyan(services.map((s) => s.serviceName).join('\n')));
      }
    );

    instance.eventEmitter.on(
      ClusterCleanupEvents.stackDeletionStarted,
      (stackId) => {
        console.log(`Started deleting stack with id ${chalk.cyan(stackId)}`);
      }
    );

    instance.eventEmitter.on(
      ClusterCleanupEvents.resourceDeleted,
      (resource) => {
        console.log(
          `${chalk.green('Successfully')} deleted ${
            resource.ResourceType
          } ${chalk.cyan(resource.PhysicalResourceId)}`
        );
      }
    );

    instance.eventEmitter.on(
      ClusterCleanupEvents.stackDeletionDone,
      (stackId) => {
        console.log(
          `${chalk.green('Successfully')} deleted stack with id ${chalk.cyan(
            stackId
          )}`
        );
      }
    );

    instance.eventEmitter.on(ClusterCleanupEvents.clusterDeleted, (cluster) => {
      console.log(
        `${chalk.green('Successfully')} deleted cluster called ${chalk.cyan(
          cluster
        )}`
      );
    });
  }

  process.on('exit', () => {
    instance.eventEmitter.removeAllListeners();
  });

  return instance;
}
