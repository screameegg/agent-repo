import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequestDedupeKey } from './requestDedupe';

test('builds the same dedupe key for equivalent GET requests', () => {
  const first = buildRequestDedupeKey({
    method: 'get',
    baseURL: '/api',
    url: '/agents',
    params: { size: 50, current: 1 },
    headers: { Authorization: 'Bearer token-a' },
  });
  const second = buildRequestDedupeKey({
    method: 'GET',
    baseURL: '/api',
    url: '/agents',
    params: { current: 1, size: 50 },
    headers: { Authorization: 'Bearer token-a' },
  });

  assert.equal(first, second);
});

test('does not dedupe GET requests with different params', () => {
  const first = buildRequestDedupeKey({
    method: 'get',
    url: '/skills',
    params: { current: 1, keyword: 'agent' },
  });
  const second = buildRequestDedupeKey({
    method: 'get',
    url: '/skills',
    params: { current: 1, keyword: 'memory' },
  });

  assert.notEqual(first, second);
});

test('does not dedupe requests across different authorization headers', () => {
  const first = buildRequestDedupeKey({
    method: 'get',
    url: '/profile',
    headers: { Authorization: 'Bearer token-a' },
  });
  const second = buildRequestDedupeKey({
    method: 'get',
    url: '/profile',
    headers: { Authorization: 'Bearer token-b' },
  });

  assert.notEqual(first, second);
});

test('does not build a dedupe key for non-GET requests', () => {
  const key = buildRequestDedupeKey({
    method: 'post',
    url: '/agents',
    data: { name: 'Agent' },
  });

  assert.equal(key, null);
});
