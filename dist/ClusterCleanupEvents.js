"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
var ClusterCleanupEvents;
(function (ClusterCleanupEvents) {
    ClusterCleanupEvents["start"] = "ClusterCleanup.start";
    ClusterCleanupEvents["done"] = "ClusterCleanup.done";
    ClusterCleanupEvents["error"] = "ClusterCleanup.error";
    ClusterCleanupEvents["stackFound"] = "ClusterCleanup.stackFound";
    ClusterCleanupEvents["servicesFound"] = "ClusterCleanup.servicesFound";
    ClusterCleanupEvents["servicesScaledDown"] = "ClusterCleanup.servicesScaledDown";
    ClusterCleanupEvents["servicesDeleted"] = "ClusterCleanup.servicesDeleted";
    ClusterCleanupEvents["instancesFound"] = "ClusterCleanup.instancesFound";
    ClusterCleanupEvents["instancesDeregistered"] = "ECSCluserManager.instancesDeregistered";
    ClusterCleanupEvents["stackDeletionStarted"] = "ClusterCleanup.stackDeletionStarted";
    ClusterCleanupEvents["stackDeletionDone"] = "ClusterCleanup.stackDeletionDone";
    ClusterCleanupEvents["resourceDeleted"] = "ClusterCleanup.resourceDeleted";
    ClusterCleanupEvents["clusterDeleted"] = "ClusterCleanup.clusterDeleted";
})(ClusterCleanupEvents = exports.ClusterCleanupEvents || (exports.ClusterCleanupEvents = {}));
class ClusterCleanupEventEmitter {
    constructor(verbose = false) {
        this.events = new events_1.EventEmitter();
        this.verbose = verbose;
    }
    emit(event, ...data) {
        if (this.verbose) {
            console.log(`Emitting event ${event}`);
        }
        return this.events.emit(event, ...data);
    }
    removeAllListeners(event) {
        this.events.removeAllListeners(event);
        return this;
    }
    onStart(l) {
        this.events.addListener(ClusterCleanupEvents.start, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.start, l); };
    }
    onStackFound(l) {
        this.events.addListener(ClusterCleanupEvents.stackFound, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.stackFound, l); };
    }
    onServicesFound(l) {
        this.events.addListener(ClusterCleanupEvents.servicesFound, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.servicesFound, l); };
    }
    onServicesScaledDown(l) {
        this.events.addListener(ClusterCleanupEvents.servicesScaledDown, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.servicesScaledDown, l); };
    }
    onInstancesFound(l) {
        this.events.addListener(ClusterCleanupEvents.instancesFound, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.instancesFound, l); };
    }
    onInstancesDeregistered(l) {
        this.events.addListener(ClusterCleanupEvents.instancesDeregistered, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.instancesDeregistered, l); };
    }
    onStackDeletionStarted(l) {
        this.events.addListener(ClusterCleanupEvents.stackDeletionStarted, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.stackDeletionStarted, l); };
    }
    onStackDeletionDone(l) {
        this.events.addListener(ClusterCleanupEvents.stackDeletionDone, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.stackDeletionDone, l); };
    }
    onResourceDeleted(l) {
        this.events.addListener(ClusterCleanupEvents.resourceDeleted, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.resourceDeleted, l); };
    }
    onClusterDeleted(l) {
        this.events.addListener(ClusterCleanupEvents.clusterDeleted, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.clusterDeleted, l); };
    }
    onDone(l) {
        this.events.addListener(ClusterCleanupEvents.done, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.done, l); };
    }
    onError(l) {
        this.events.addListener(ClusterCleanupEvents.error, l);
        return () => { this.events.removeListener(ClusterCleanupEvents.error, l); };
    }
}
exports.ClusterCleanupEventEmitter = ClusterCleanupEventEmitter;
