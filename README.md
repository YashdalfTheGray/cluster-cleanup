[![Build Status](https://travis-ci.com/YashdalfTheGray/cluster-manager.svg?branch=master)](https://travis-ci.com/YashdalfTheGray/cluster-manager)

# cluster-manager
Library to fill the gap between the SDK and the CLI/Console for AWS ECS.

## What does this do?

The CLI and the ECS Console go through about 9 steps to clean up an ECS cluster but the SDK doesn't have any provisions to do this. The steps are listed below and this library notifies the user as these steps are completed.

1. Find CloudFormation stack
1. Find all services
1. Scale all services down to 0
1. Find all container instances
1. Deregister all container instances
1. Delete all services
1. Delete CloudFormation stack
1. Poll CloudFormation until stack is deleted or timeout
1. Attempt deleting the cluster

## Usage

Run `npm install cluster-manager` to pull down the package. Require it in your code by creating an instance of the `ECSClusterManager` class which can be passed the same config object as the AWS SDK. You can then use it to delete clusters completely including the resources that come with ECS clusters. Sample code below.

```javascript
const ECSClusterManager = require('cluster-manager');

const ecsClusterManager = new ECSClusterManager();

(async() => {
    const events = ecsClusterManager.deleteClusterAndResources('default');

    events.onError(e => console.error(e));
})
```

The `ECSClusterManager` constructor takes the standard AWS SDK for Node.js options object but adds another optional property called `enableFargate`. This will make ClusterManager look for Fargate services in addition to EC2 services while deleting the cluster.

The `deleteClusterAndResources` function can optionally take an object with a single property called `verbose` which will log out every event coming from cluster manager.

## Events

The `events` instance returned from the `.deleteClusterAndResrouces()` call inherits from the Node.js `EventEmitter` and adds methods to listen to all the possible events to increase discovery through the typings file. All the event listener functions return a function that can be called to remove the listener. The events, their methods and the data associated with the event is listed below.

| Event                   | Data and Type                        | Listener Method           |
|-------------------------|--------------------------------------|---------------------------|
| `start`                 | `clusterName: string`                | `onStart`                 |
| `stackFound`            | `stack: CloudFormation.Stack`        | `onStackFound`            |
| `servicesFound`         | `serviceArns: string[]`              | `onServicesFound`         |
| `servicesScaledDown`    | `services: ECS.Service[]`            | `onServicesScaledDown`    |
| `instancesFound`        | `instanceArns: string[]`             | `onInstancesFound`        |
| `instancesDeregistered` | `instances: ECS.ContainerInstance[]` | `onInstancesDeregistered` |
| `stackDeletionStarted`  | `stackId: string`                    | `onStackDeletionStarted`  |
| `stackDeletionDone`     | `stackId: string`                    | `onStackDeletionDone`     |
| `resourceDeleted`       | `event: CloudFormation.StackEvent`   | `onResourceDeleted`       |
| `clusterDeleted`        | `cluster: ECS.Cluster`               | `onClusterDeleted`        |
| `done`                  | `clusterName: string`                | `onDone`                  |
| `error`                 | `error: Error`                       | `onError`                 |

For example, to listen for when the CloudFormation stack is deleted,

```javascript
const removeListener = events.onStackDeletionDone((stackId) => {
    console.log(`Stack ${stackId} deleted!`)'
});

// other code

removeListener();
```

All of this information is also surfaced via typings that are included in this library.

Issue and PR templates derived from [smhxx/atom-ts-transpiler](https://github.com/smhxx/atom-ts-transpiler).
