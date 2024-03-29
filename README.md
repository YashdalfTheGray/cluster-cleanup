[![Build and test](https://github.com/YashdalfTheGray/cluster-cleanup/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/YashdalfTheGray/cluster-cleanup/actions/workflows/build-and-test.yml)
![npm package](https://img.shields.io/npm/v/cluster-cleanup?label=npm%20package)

# cluster-cleanup

Library to fill the gap between the SDK and the CLI/Console for deleting an ECS cluster. Also comes with a CLI as of version 3.0.0!

## What does this do?

The CLI and the ECS Console go through about 9 steps to clean up an ECS cluster but the SDK doesn't have any provisions to do this. The steps are listed below and this library notifies the user as these steps are completed.

1. Find CloudFormation stack
1. Find all services
1. Scale all services down to 0
1. Find all running tasks
1. Stop all running tasks
1. Find all container instances
1. Deregister all container instances
1. Delete all services
1. Delete CloudFormation stack
1. Poll CloudFormation until stack is deleted or timeout
1. Attempt deleting the cluster

## Usage

### Docker

This code, built and ready to go, is available through DockerHub. You can pull this container image using `docker pull yashdalfthegray/cluster-cleanup`. You can also just run the container directly by `docker run -it yashdalfthegray/cluster-cleanup`. You can pass all of the CLI options into the container. Some examples are listed below.

To cleanup a cluster named `spiderman` in the `ap-northeast-1` region using credentials from the host environment variables,

```
docker run -it -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY [-e AWS_SESSION_TOKEN] yashdalfthegray/cluster-cleanup --cluster-name spiderman --verbose --color --region ap-northeast-1
```

The `--color` and the `--verbose` options are optional, the `--verbose` option can be stacked as well using `-vv`. If no color in the output is desired, you can use `--no-color`. The `--color` option is the default. Using the `-e` option with `docker run` will pass the same environment variables from the host to the container.

You can also mix and match the following command line options to provide credentials,

| Option                    | effect                                        |
| ------------------------- | --------------------------------------------- |
| `--aws-access-key-id`     | provide the AWS access key ID                 |
| `--aws-secret-access-key` | provide the AWS secret access key             |
| `--aws-session-token`     | provide the AWS session token                 |
| `--assume-role-arn`       | provide the ARN of the role to assume         |
| `--external-id`           | provide the external ID of the role to assume |

You can also run `docker run -it yashdalfthegray/cluster-cleanup --help` to see all of the options.

### CLI

Run `npm install --global cluster-cleanup` to install the CLI. Once installed, run `cluster-cleanup --help` to learn about all the options. This CLI interfaces with AWS so credentials are required. The CLI can use credentials already configured from AWS CLI, and there are options to pass in an assume role ARN (and an external ID) or to use a profile.

You can also just pass in the credentials themselves. It is done this way to support multiple entrypoints for credentials, somewhat modeled after the AWS CLI/SDK behavior. There is also a `--no-color` option to disable color output, in case the logs need to be captured and parsed.

### Library usage

Run `npm install cluster-cleanup` to pull down the package. Require it in your code, and create an instance of the `ClusterCleanup` class which can be passed the same config object as the AWS SDK. You can then use it to delete clusters completely including the resources that come with ECS clusters. Sample code below.

```javascript
const { ClusterCleanup, ClusterCleanupEvents } = require('cluster-cleanup');

const clusterCleanup = new ClusterCleanup();
const events = clusterCleanup.eventEmitter;

async () => {
  const deletedResources = clusterCleanup.deleteClusterAndResources('default');

  events.on(ClusterCleanupEvents.error, (e) => console.error(e));
  events.on(ClusterCleanupEvents.done, () => console.log('Done'));
};
```

The `ClusterCleanup` constructor takes the standard AWS SDK for Node.js options object. The constructor, optionally, can also take initialized clients for ECS and CloudFormation if you don't want `ClusterCleanup` to create new clients.

The `deleteClusterAndResources` function can be provided a stack name (2nd argument) as well as a verbose option as a number (3rd argument). Additionally, it take an object with the following properties as the last argument,

- a property called `waiterTimeoutMs` which is the timeout in milliseconds for the AWS SDK waiter to wait for the CloudFormation stack to be deleted, defaults to 10 minutes
- a property called `waiterPollMinDelayMs` which is the minimum delay in milliseconds between each run of `cloudformation::describeStacks` with the stack being deleted, defaults to 30 seconds
- a property called `stackEventsPollIntervalMs` which is the interval in milliseconds between each run of `cloudformation::describeStackEvents` for the stack being deleted, defaults to 30 seconds

We call `cloudformation::describeStackEvents` so that we can get information on the cleanup of the resources specified by the stack. We set up a waiter that uses `cloudformation::describeStacks` to wait for the stack being deleted.

All of the arguments besides the cluster name are optional.

## Events

The `events` instance returned from the `ClusterCleanup.events` getter call inherits from the Node.js `EventEmitter` and adds override type signatures to the `on` method to increase visibility into what events are emitted and what data goes along with each event. Calling `on` also returns a function that can be called to remove the listener. The events and the expected data passed to the listener are listed below.

| Event                   | Data and Type                        |
| ----------------------- | ------------------------------------ |
| `start`                 | `clusterName: string`                |
| `stackFound`            | `stack: CloudFormation.Stack`        |
| `servicesFound`         | `serviceArns: string[]`              |
| `servicesScaledDown`    | `services: ECS.Service[]`            |
| `tasksFound`            | `taskArns: string[]`                 |
| `tasksStopped`          | `tasks: ECS.Task[]`                  |
| `instancesFound`        | `instanceArns: string[]`             |
| `instancesDeregistered` | `instances: ECS.ContainerInstance[]` |
| `stackDeletionStarted`  | `stackId: string`                    |
| `stackDeletionDone`     | `stackId: string`                    |
| `resourceDeleted`       | `event: CloudFormation.StackEvent`   |
| `clusterDeleted`        | `cluster: ECS.Cluster`               |
| `done`                  | `clusterName: string`                |
| `error`                 | `error: Error`                       |
| `doneWithError`         | `error: Error`                       |

For example, to listen for when the CloudFormation stack is deleted,

```javascript
const removeListener = events.on(
  ClusterCleanupEvents.stackDeletionDone,
  (stackId) => {
    console.log(`Stack ${stackId} deleted!`);
  }
);

// other code

removeListener();
```

All of this information is also surfaced via typings that are included in this library.

## ClI Support

This package also vends a decorator that listens to all the events and logs out everything (with some color using `chalk`) to the console. This is meant to make creating an executable file that runs this script a bit better and remove duplication of code.

This package also includes an executable that uses the CLI suppport functions to allow users to configure and run the cluster cleanup script. Run `./bin/cluster-cleanup --help` to see all the configuration options.

Issue and PR templates derived from [smhxx/atom-ts-transpiler](https://github.com/smhxx/atom-ts-transpiler).
