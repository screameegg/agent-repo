import test from 'node:test';
import assert from 'node:assert/strict';
import { npsDismissedStorageKey, shouldShowNpsPrompt } from './feedbackPrompt';

test('shows NPS prompt only when not submitted and not locally dismissed', () => {
  assert.equal(shouldShowNpsPrompt({ submitted: false, dismissed: false }), true);
  assert.equal(shouldShowNpsPrompt({ submitted: true, dismissed: false }), false);
  assert.equal(shouldShowNpsPrompt({ submitted: false, dismissed: true }), false);
});

test('builds a user-scoped NPS dismissed storage key', () => {
  assert.equal(npsDismissedStorageKey('1001'), 'lobster-feedback-nps-dismissed-1001');
  assert.equal(npsDismissedStorageKey(undefined), 'lobster-feedback-nps-dismissed-anonymous');
});
