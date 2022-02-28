"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCliList = exports.decorateClusterCleanup = void 0;
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
            console.log(generateCliList(services));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.servicesScaledDown, (services) => {
            console.log('Scaled down the following services to 0');
            console.log(generateCliList(services.map((s) => s.serviceArn)));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.tasksFound, (tasks) => {
            console.log('Found the following tasks');
            console.log(generateCliList(tasks));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.tasksStopped, (tasks) => {
            console.log('Stopped the following tasks');
            console.log(generateCliList(tasks.map((t) => t.taskArn)));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.instancesFound, (instances) => {
            console.log('Found the following instances');
            console.log(generateCliList(instances));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.instancesDeregistered, (instances) => {
            console.log('Deregistered the following instances');
            console.log(generateCliList(instances.map((i) => i.containerInstanceArn)));
        });
        instance.eventEmitter.on(_1.ClusterCleanupEvents.servicesDeleted, (services) => {
            console.log('Deleted the following services');
            console.log(generateCliList(services.map((s) => s.serviceArn)));
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
            console.log(`${chalk.green('Successfully')} deleted cluster called ${chalk.cyan(cluster.clusterArn)}`);
        });
    }
    process.on('exit', () => {
        instance.eventEmitter.removeAllListeners();
    });
    return instance;
}
exports.decorateClusterCleanup = decorateClusterCleanup;
function generateCliList(things, color = chalk.cyan, stringifier) {
    return things
        .map((t) => color(stringifier ? stringifier(t) : t.toString()))
        .map((s) => `- ${s}`)
        .join('\n');
}
exports.generateCliList = generateCliList;
