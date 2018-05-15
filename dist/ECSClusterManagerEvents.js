"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
var ClusterManagerEvents;
(function (ClusterManagerEvents) {
    ClusterManagerEvents["start"] = "ECSClusterManager.start";
    ClusterManagerEvents["done"] = "ECSClusterManager.done";
    ClusterManagerEvents["stackFound"] = "ECSClusterManager.stackFound";
    ClusterManagerEvents["servicesFound"] = "ECSClusterManager.servicesFound";
    ClusterManagerEvents["servicesScaledDown"] = "ECSClusterManager.servicesScaledDown";
    ClusterManagerEvents["servicesDeleted"] = "ECSClusterManager.servicesDeleted";
    ClusterManagerEvents["instancesFound"] = "ECSClusterManager.instancesFound";
    ClusterManagerEvents["instancesDeregistered"] = "ECSCluserManager.instancesDeregistered";
    ClusterManagerEvents["stackDeletionStarted"] = "ECSClusterManager.stackDeletionStarted";
    ClusterManagerEvents["resourceDeleted"] = "ECSClusterManager.resourceDeleted";
    ClusterManagerEvents["clusterDeleted"] = "ECSClusterManager.clusterDeleted";
})(ClusterManagerEvents = exports.ClusterManagerEvents || (exports.ClusterManagerEvents = {}));
class ECSClusterManagerEventEmitter {
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
    onStackFound(l) {
        this.events.addListener(ClusterManagerEvents.stackFound, l);
        return () => { this.events.removeListener(ClusterManagerEvents.stackFound, l); };
    }
    onServicesFound(l) {
        this.events.addListener(ClusterManagerEvents.servicesFound, l);
        return () => { this.events.removeListener(ClusterManagerEvents.servicesFound, l); };
    }
    onServicesScaledDown(l) {
        this.events.addListener(ClusterManagerEvents.servicesScaledDown, l);
        return () => { this.events.removeListener(ClusterManagerEvents.servicesScaledDown, l); };
    }
    onInstancesFound(l) {
        this.events.addListener(ClusterManagerEvents.instancesFound, l);
        return () => { this.events.removeListener(ClusterManagerEvents.instancesFound, l); };
    }
    onInstancesDeregistered(l) {
        this.events.addListener(ClusterManagerEvents.instancesDeregistered, l);
        return () => { this.events.removeListener(ClusterManagerEvents.instancesDeregistered, l); };
    }
}
exports.ECSClusterManagerEventEmitter = ECSClusterManagerEventEmitter;
