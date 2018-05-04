import { EventEmitter } from 'events';

export class ECSClusterManagerEvents {
    events: EventEmitter;

    public constructor() {
        this.events = new EventEmitter();
    }
}