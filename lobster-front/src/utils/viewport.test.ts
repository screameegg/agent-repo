import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowDesktopEditor } from './viewport';

test('shows skill editor only on desktop-width viewports', () => {
  assert.equal(shouldShowDesktopEditor(767), false);
  assert.equal(shouldShowDesktopEditor(768), true);
});
