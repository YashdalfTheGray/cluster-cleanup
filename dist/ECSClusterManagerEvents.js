"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
var ClusterManagerEvents;
(function (ClusterManagerEvents) {
    ClusterManagerEvents["servicesFound"] = "ECSClusterManager.servicesFound";
    ClusterManagerEvents["servicesScaledDown"] = "ECSClusterManager.servicesScaledDown";
    ClusterManagerEvents["servicesDeleted"] = "ECSClusterManager.servicesDeleted";
    ClusterManagerEvents["instancesFound"] = "ECSClusterManager.instancesFound";
    ClusterManagerEvents["instancesDeregistered"] = "ECSCluserManager.instancesDeregistered";
    ClusterManagerEvents["stackDeletionStarted"] = "ECSClusterManager.stackDeletionStarted";
    ClusterManagerEvents["resourceDeleted"] = "ECSClusterManager.resourceDeleted";
})(ClusterManagerEvents = exports.ClusterManagerEvents || (exports.ClusterManagerEvents = {}));
class ECSClusterManagerEventEmitter {
    constructor() {
        this.events = new events_1.EventEmitter();
    }
    emit(event, data) {
        return this.events.emit(event, data);
    }
    removeAllListeners(event) {
        this.events.removeAllListeners(event);
        return this;
    }
    onServicesFound(l) {
        return this.events.addListener(ClusterManagerEvents.servicesFound, l);
    }
    onServicesScaledDown(l) {
        return this.events.addListener(ClusterManagerEvents.servicesScaledDown, l);
    }
}
exports.ECSClusterManagerEventEmitter = ECSClusterManagerEventEmitter;
