import test from 'ava';

import {
  ClusterCleanupEventEmitter,
  ClusterCleanupEvents,
} from './ClusterCleanupEvents';

test('ClusterCleanupEventEmitter.removeAllListeners is fluent', (t) => {
  const events = new ClusterCleanupEventEmitter();

  t.not(events.removeAllListeners().emit, undefined);
});

test(`ClusterCleanupEventEmitter.on returns a listener remover`, (t) => {
  const events = new ClusterCleanupEventEmitter();

  t.is(typeof events.on(ClusterCleanupEvents.done, (_) => {}), 'function');
});

Object.keys(ClusterCleanupEvents).forEach((e) => {
  const events = new ClusterCleanupEventEmitter();

  test(`ClusterCleanupEventEmitter.on accepts ${e} as an event`, (t) => {
    // this tests mostly serves as a typecheck test
    const unregister = events.on(ClusterCleanupEvents[e], (_) => {});
    t.truthy(unregister);
    t.notThrows(() => unregister());
  });
});
