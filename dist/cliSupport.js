"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decorateClusterCleanup = void 0;
const chalk = require("chalk");
const _1 = require(".");
function decorateClusterCleanup(instance, verbose = true) {
    instance.eventEmitter.on(_1.ClusterCleanupEvents.doneWithError, (e) => {
        console.log(chalk.red(e.message));
        console.error(e);
        process.exit(1);
    });
    instance.eventEmitter.on(_1.ClusterCleanupEvents.error, (e) => {
        console.log(chalk.red(e.message));
        console.error(e);
    });
    instance.eventEmitter.on(_1.ClusterCleanupEvents.start, (clusterName) => console.log(`Starting cleanup of cluster ${chalk.cyan(clusterName)}`));
    instance.eventEmitter.on(_1.ClusterCleanupEvents.done, (clusterName) => {
        console.log(`${chalk.green('Successfully')} cleaned up resources for cluster ${chalk.cyan(clusterName)}`);
    });
    if (verbose) {
        instance.eventEmitter.on(_1.ClusterCleanupEvents.stackFound, (stack) => {
            console.log(`Found stack for cluster by name ${chalk.cyan(stack.StackName)}`);
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.servicesFound, (services) => {
            console.log('Found the following services');
            console.log(chalk.cyan(services.join('\n')));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.servicesScaledDown, (services) => {
            console.log('Scaled down the following services to 0');
            console.log(chalk.cyan(services.map((s) => s.serviceArn).join('\n')));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.tasksFound, (tasks) => {
            console.log('Found the following tasks');
            console.log(chalk.cyan(tasks.join('\n')));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.tasksStopped, (tasks) => {
            console.log('Stopped the following tasks');
            console.log(chalk.cyan(tasks.map((t) => t.taskArn).join('\n')));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.instancesFound, (instances) => {
            console.log('Found the following instances');
            console.log(chalk.cyan(instances.join('\n')));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.instancesDeregistered, (instances) => {
            console.log('Deregistered the following instances');
            console.log(chalk.cyan(instances.map((i) => i.containerInstanceArn).join('\n')));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.servicesDeleted, (services) => {
            console.log('Deleted the following services');
            console.log(chalk.cyan(services.map((s) => s.serviceName).join('\n')));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.stackDeletionStarted, (stackId) => {
            console.log(`Started deleting stack with id ${chalk.cyan(stackId)}`);
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.resourceDeleted, (resource) => {
            console.log(`${chalk.green('Successfully')} deleted ${resource.ResourceType} ${chalk.cyan(resource.PhysicalResourceId)}`);
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.stackDeletionDone, (stackId) => {
            console.log(`${chalk.green('Successfully')} deleted stack with id ${chalk.cyan(stackId)}`);
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.clusterDeleted, (cluster) => {
            console.log(`${chalk.green('Successfully')} deleted cluster called ${chalk.cyan(cluster)}`);
        });
    }
    process.on('exit', () => {
        instance.eventEmitter.removeAllListeners();
    });
    return instance;
}
exports.decorateClusterCleanup = decorateClusterCleanup;
