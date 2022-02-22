import { ECSClientConfig } from '@aws-sdk/client-ecs';
export declare type Listener<T> = (data: T) => void;
export declare type RemoveListenerFunction = () => void;
export interface ClusterCleanupConfig extends ECSClientConfig {
    enableFargate?: boolean;
}
export interface DeleteOptions {
    verbose?: boolean;
    waiterTimeoutMs?: number;
    waiterPollMinDelayMs?: number;
    stackEventsPollIntervalMs?: number;
}
