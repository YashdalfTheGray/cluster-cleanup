import test from 'ava';

import {
  ClusterCleanupEventEmitter,
  ClusterCleanupEvents,
} from './ClusterCleanupEvents';

test('ClusterCleanupEventEmitter.removeAllListeners is fluent', (t) => {
  const events = new ClusterCleanupEventEmitter();

  // eslint-disable-next-line @typescript-eslint/unbound-method
  t.not(events.removeAllListeners().emit, undefined);
});

test(`ClusterCleanupEventEmitter.on returns a listener remover`, (t) => {
  const events = new ClusterCleanupEventEmitter();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  t.is(typeof events.on(ClusterCleanupEvents.done, (_) => {}), 'function');
});

Object.keys(ClusterCleanupEvents).forEach((e) => {
  const events = new ClusterCleanupEventEmitter();

  test(`ClusterCleanupEventEmitter.on accepts ${e} as an event`, (t) => {
    // this tests mostly serves as a typecheck test
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unsafe-argument
    const unregister = events.on(ClusterCleanupEvents[e], (_) => {});
    t.truthy(unregister);
    t.notThrows(() => unregister());
  });
});
