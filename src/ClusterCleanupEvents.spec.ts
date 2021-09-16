import test from 'ava';
import { upperFirst } from 'lodash';

import {
  ClusterCleanupEventEmitter,
  ClusterCleanupEvents,
} from './ClusterCleanupEvents';

const toMethodName = (event: string) => `on${upperFirst(event)}`;

test('ClusterCleanupEventEmitter.removeAllListeners is fluent', (t) => {
  const events = new ClusterCleanupEventEmitter();

  t.not(events.removeAllListeners().emit, undefined);
});

Object.keys(ClusterCleanupEvents)
  .map((k) => toMethodName(k))
  .forEach((m) => {
    const events = new ClusterCleanupEventEmitter();

    test(`ClusterCleanupEventEmitter.${m} exists`, (t) => {
      t.not(events[m], undefined);
    });

    test(`ClusterCleanupEventEmitter.${m} returns a listener remover`, (t) => {
      t.is(typeof events[m](() => true), 'function');
    });
  });
