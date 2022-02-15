"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCleanerWithConfig = void 0;
const _1 = require(".");
function setupCleanerWithConfig(config, verbose = true) {
    const cleaner = new _1.ClusterCleanup(config);
    cleaner.eventEmitter.on(_1.ClusterCleanupEvents.doneWithError, (e) => {
        console.error(e);
        process.exit(1);
    });
    cleaner.eventEmitter.on(_1.ClusterCleanupEvents.error, (e) => {
        console.error(e);
    });
    cleaner.eventEmitter.on(_1.ClusterCleanupEvents.start, (clusterName) => console.log(`Starting cleanup of cluster ${clusterName}`));
    cleaner.eventEmitter.on(_1.ClusterCleanupEvents.done, (cluster) => {
        console.log(`Successfully cleaned up resources for cluster ${cluster}`);
    });
    if (verbose) {
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.stackFound, (stack) => {
            console.log(`Found stack for cluster by name ${stack.StackName}`);
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.servicesFound, (services) => {
            console.log('Found the following services');
            console.log(services.join('\n'));
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.servicesScaledDown, (services) => {
            console.log('Scaled down the following services to 0');
            console.log(services.map((s) => s.serviceName).join('\n'));
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.tasksFound, (tasks) => {
            console.log('Found the following tasks');
            console.log(tasks.join('\n'));
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.tasksStopped, (tasks) => {
            console.log('Stopped the following tasks');
            console.log(tasks.map((t) => t.taskArn).join('\n'));
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.instancesFound, (instances) => {
            console.log('Found the following instances');
            console.log(instances.join('\n'));
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.instancesDeregistered, (instances) => {
            console.log('Deregistered the following instances');
            console.log(instances.map((i) => i.containerInstanceArn).join('\n'));
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.servicesDeleted, (services) => {
            console.log('Deleted the following services');
            console.log(services.map((s) => s.serviceName).join('\n'));
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.stackDeletionStarted, (stackId) => {
            console.log(`Started deleting stack with id ${stackId}`);
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.resourceDeleted, (resource) => {
            console.log(`Deleted ${resource.ResourceType} ${resource.PhysicalResourceId}`);
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.stackDeletionDone, (stackId) => {
            console.log(`Deleted stack with id ${stackId}`);
        });
        cleaner.eventEmitter.on(_1.ClusterCleanupEvents.clusterDeleted, (cluster) => {
            console.log(`Successfully deleted cluster called ${cluster}`);
        });
    }
    process.on('exit', () => {
        cleaner.eventEmitter.removeAllListeners();
    });
    return cleaner;
}
exports.setupCleanerWithConfig = setupCleanerWithConfig;
