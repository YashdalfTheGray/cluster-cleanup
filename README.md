[![Build Status](https://travis-ci.com/YashdalfTheGray/cluster-manager.svg?branch=master)](https://travis-ci.com/YashdalfTheGray/cluster-manager)

# cluster-manager
Library to fill the gap between the SDK and the CLI/Console for AWS ECS.

## Usage

Run `npm install cluster-manager` to pull down the package. Require it in your code by creating an instance of the `ECSClusterManager` class which can be passed the same config object as the AWS SDK. You can then use it to delete clusters completely including the resources that come with ECS clusters. Sample code below.

```javascript
const ECSClusterManager = require('cluster-manager');

const ecsClusterManager = new ECSClusterManager();
await ecsClusterManager.deleteClusterAndResources('default');
```

Issue and PR templates derived from [smhxx/atom-ts-transpiler](https://github.com/smhxx/atom-ts-transpiler).
