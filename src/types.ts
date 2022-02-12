import { ECSClientConfig } from '@aws-sdk/client-ecs';

export interface ClusterCleanupConfig extends ECSClientConfig {
  enableFargate?: boolean;
}

export interface DeleteOptions {
  verbose?: boolean;
}
