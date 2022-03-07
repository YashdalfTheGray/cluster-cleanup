import * as chalk from 'chalk';
import { Command } from 'commander';
import {
  fromTemporaryCredentials,
  fromIni,
} from '@aws-sdk/credential-providers';

import {
  ClusterCleanup,
  ClusterCleanupConfig,
  ClusterCleanupEvents,
  KnownCliOptions,
} from '.';

export function setupCliOptions(program: Command) {
  function increaseVerbosity(_: string, previousValue: number) {
    return previousValue + 1;
  }

  return program
    .version('2.1.0')
    .requiredOption(
      '-c, --cluster-name <name>',
      'The name of the cluster to clean up'
    )
    .option('-s, --stack-name <name>', 'The name of the stack to clean up')
    .option(
      '-v, --verbose',
      'Enable verbose logging, can be specified multiple times increasing verbosity',
      increaseVerbosity,
      0
    )
    .option('--aws-access-key-id <id>', 'AWS Access Key ID')
    .option('--aws-secret-access-key <key>', 'AWS Secret Access Key')
    .option('--aws-session-token <token>', 'AWS Session Token')
    .option(
      '--assume-role-arn <arn>',
      'The ARN of the role to assume for permissions'
    )
    .option(
      '--external-id <id>',
      'The external ID to provide STS for the assume role call'
    )
    .option(
      '--aws-profile <profile>',
      'The AWS profile to use, ignored if credentials or assume role arn is provided'
    )
    .option('--region <region>', 'The AWS region to use');
}

export function buildClientConfigObject(
  cliOptions: KnownCliOptions
): ClusterCleanupConfig {
  const {
    awsAccessKeyId: accessKeyId,
    awsSecretAccessKey: secretAccessKey,
    awsSessionToken: sessionToken,
    assumeRoleArn,
    externalId,
    awsProfile: profile,
    region,
  } = cliOptions;

  const config: ClusterCleanupConfig = {
    region,
  };

  if (accessKeyId && secretAccessKey && sessionToken) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    };
  } else if (assumeRoleArn) {
    const assumeRoleCreds = (() => {
      if (accessKeyId && secretAccessKey) {
        return { accessKeyId, secretAccessKey };
      } else if (profile) {
        return fromIni({ profile });
      } else {
        return undefined;
      }
    })();

    config.credentials = fromTemporaryCredentials({
      masterCredentials: assumeRoleCreds,
      params: {
        RoleArn: assumeRoleArn,
        ExternalId: externalId,
        RoleSessionName: `clustercleanup-session-${Date.now()}`,
        DurationSeconds: 3600,
      },
      clientConfig: { region },
    });
  } else if (profile) {
    config.credentials = fromIni({ profile });
  }

  return config;
}

export function decorateClusterCleanup(instance: ClusterCleanup, verbose = 0) {
  instance.eventEmitter.on(ClusterCleanupEvents.doneWithError, (e) => {
    console.log(chalk.red(e.message));
    console.error(e);
    process.exit(1);
  });

  instance.eventEmitter.on(ClusterCleanupEvents.error, (e) => {
    console.log(chalk.red(e.message));
    console.log(
      chalk.dim('Skipping error stacktrace, run with -vv to see it.')
    );
    if (verbose >= 2) {
      console.error(e);
    }
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

  if (verbose >= 1) {
    instance.eventEmitter.on(ClusterCleanupEvents.stackFound, (stack) => {
      console.log(
        `Found stack for cluster by name ${chalk.cyan(stack.StackName)}`
      );
    });

    instance.eventEmitter.on(ClusterCleanupEvents.servicesFound, (services) => {
      console.log('Found the following services');
      console.log(generateCliList(services));
    });

    instance.eventEmitter.on(
      ClusterCleanupEvents.servicesScaledDown,
      (services) => {
        console.log('Scaled down the following services to 0');
        console.log(generateCliList(services.map((s) => s.serviceArn)));
      }
    );

    instance.eventEmitter.on(ClusterCleanupEvents.tasksFound, (tasks) => {
      console.log('Found the following tasks');
      console.log(generateCliList(tasks));
    });

    instance.eventEmitter.on(ClusterCleanupEvents.tasksStopped, (tasks) => {
      console.log('Stopped the following tasks');
      console.log(generateCliList(tasks.map((t) => t.taskArn)));
    });

    instance.eventEmitter.on(
      ClusterCleanupEvents.instancesFound,
      (instances) => {
        console.log('Found the following instances');
        console.log(generateCliList(instances));
      }
    );

    instance.eventEmitter.on(
      ClusterCleanupEvents.instancesDeregistered,
      (instances) => {
        console.log('Deregistered the following instances');
        console.log(
          generateCliList(instances.map((i) => i.containerInstanceArn))
        );
      }
    );

    instance.eventEmitter.on(
      ClusterCleanupEvents.servicesDeleted,
      (services) => {
        console.log('Deleted the following services');
        console.log(generateCliList(services.map((s) => s.serviceArn)));
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
          cluster.clusterArn
        )}`
      );
    });
  }

  process.on('exit', () => {
    instance.eventEmitter.removeAllListeners();
  });

  return instance;
}

export function generateCliList<T extends Object>(
  things: T[],
  color = chalk.cyan,
  stringifier?: (t: T) => string
) {
  return things
    .map((t) => color(stringifier ? stringifier(t) : t.toString()))
    .map((s) => `- ${s}`)
    .join('\n');
}
