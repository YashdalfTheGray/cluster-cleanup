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
    await ecsClusterManager.deleteClusterAndResources('default');
})
```

Issue and PR templates derived from [smhxx/atom-ts-transpiler](https://github.com/smhxx/atom-ts-transpiler).
