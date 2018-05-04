"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class ECSClusterManagerEvents {
    constructor() {
        this.events = new events_1.EventEmitter();
    }
}
exports.ECSClusterManagerEvents = ECSClusterManagerEvents;
