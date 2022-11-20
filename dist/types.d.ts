import { ECSClientConfig } from '@aws-sdk/client-ecs';
import { CloudFormationClientConfig } from '@aws-sdk/client-cloudformation';
export type Listener<T> = (data: T) => void;
export type RemoveListenerFunction = () => void;
export type ClusterCleanupConfig = ECSClientConfig | CloudFormationClientConfig;
export interface TimeoutOptions {
    waiterTimeoutMs?: number;
    waiterPollMinDelayMs?: number;
    stackEventsPollIntervalMs?: number;
}
export interface KnownCliOptions {
    clusterName: string;
    stackName: string;
    verbose: number;
    awsAccessKeyId: string;
    awsSecretAccessKey: string;
    awsSessionToken: string;
    assumeRoleArn: string;
    externalId: string;
    awsProfile: string;
    region: string;
}
