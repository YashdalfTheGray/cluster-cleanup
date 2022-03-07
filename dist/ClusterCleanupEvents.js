"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterCleanupEventEmitter = exports.ClusterCleanupEvents = void 0;
const events_1 = require("events");
const chalk = require("chalk");
var ClusterCleanupEvents;
(function (ClusterCleanupEvents) {
    ClusterCleanupEvents["start"] = "ClusterCleanup.start";
    ClusterCleanupEvents["done"] = "ClusterCleanup.done";
    ClusterCleanupEvents["doneWithError"] = "ClusterCleanup.doneWithError";
    ClusterCleanupEvents["error"] = "ClusterCleanup.error";
    ClusterCleanupEvents["stackFound"] = "ClusterCleanup.stackFound";
    ClusterCleanupEvents["servicesFound"] = "ClusterCleanup.servicesFound";
    ClusterCleanupEvents["servicesScaledDown"] = "ClusterCleanup.servicesScaledDown";
    ClusterCleanupEvents["servicesDeleted"] = "ClusterCleanup.servicesDeleted";
    ClusterCleanupEvents["tasksFound"] = "ClusterCleanup.tasksFound";
    ClusterCleanupEvents["tasksStopped"] = "ClusterCleanup.tasksStopped";
    ClusterCleanupEvents["instancesFound"] = "ClusterCleanup.instancesFound";
    ClusterCleanupEvents["instancesDeregistered"] = "ClusterCleanup.instancesDeregistered";
    ClusterCleanupEvents["stackDeletionStarted"] = "ClusterCleanup.stackDeletionStarted";
    ClusterCleanupEvents["stackDeletionDone"] = "ClusterCleanup.stackDeletionDone";
    ClusterCleanupEvents["resourceDeleted"] = "ClusterCleanup.resourceDeleted";
    ClusterCleanupEvents["clusterDeleted"] = "ClusterCleanup.clusterDeleted";
})(ClusterCleanupEvents = exports.ClusterCleanupEvents || (exports.ClusterCleanupEvents = {}));
class ClusterCleanupEventEmitter {
    events;
    verbose;
    constructor(verbose = 0) {
        this.events = new events_1.EventEmitter();
        this.verbose = verbose;
    }
    emit(event, ...data) {
        if (this.verbose >= 2) {
            console.log(chalk.dim(`[ClusterCLeanupEvents] Emitting event ${event}`));
        }
        return this.events.emit(event, ...data);
    }
    on(event, l) {
        this.events.addListener(event, l);
        return () => {
            this.events.removeListener(event, l);
        };
    }
    removeAllListeners(event) {
        this.events.removeAllListeners(event);
        return this;
    }
}
exports.ClusterCleanupEventEmitter = ClusterCleanupEventEmitter;
