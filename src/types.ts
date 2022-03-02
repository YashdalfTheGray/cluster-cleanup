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

export interface KnownCliOptions {
  clusterName: string;
  stackName: string;
  verbose: boolean;
  includeFargate: boolean;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsSessionToken: string;
  assumeRoleArn: string;
  externalId: string;
  awsProfile: string;
  region: string;
}
