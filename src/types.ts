import { ECSClientConfig } from '@aws-sdk/client-ecs';

export type Listener<T> = (data: T) => void;
export type RemoveListenerFunction = () => void;

export interface ClusterCleanupConfig extends ECSClientConfig {
  enableFargate?: boolean;
}

export interface DeleteOptions {
  verbose?: boolean;
  waiterTimeoutMs?: number;
  waiterPollMinDelayMs?: number;
  stackEventsPollIntervalMs?: number;
}