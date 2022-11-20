import { Stack, StackEvent } from '@aws-sdk/client-cloudformation';
import { Service, ContainerInstance, Task, Cluster } from '@aws-sdk/client-ecs';

export interface MockOptions {
  mock: {
    stack: Stack;
    stackEvents: StackEvent[];
    services: Service[];
    containerInstances: ContainerInstance[];
    tasks: Task[];
    cluster: Cluster;
  };
}

export function defaultMockOptions() {
  return {
    mock: {},
  } as MockOptions;
}
