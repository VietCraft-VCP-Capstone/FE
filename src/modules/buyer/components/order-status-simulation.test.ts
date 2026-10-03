import assert from 'node:assert/strict';
import test from 'node:test';
import { getSimulationTarget } from './order-status-simulation-policy.ts';

test('starts simulation from a real order without changing the source', () => {
  assert.equal(getSimulationTarget('pending', false), 'SHIPPING');
});

test('advances the simulation copy from shipping to delivered', () => {
  assert.equal(getSimulationTarget('shipping', true), 'DELIVERED');
});

test('has no next transition after delivery', () => {
  assert.equal(getSimulationTarget('completed', true), undefined);
});
