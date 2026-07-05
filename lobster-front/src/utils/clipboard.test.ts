import test from 'node:test';
import assert from 'node:assert/strict';
import { writeClipboardText } from './clipboard';

test('falls back to execCommand when Clipboard API rejects copying', async () => {
  const originalNavigator = globalThis.navigator;
  const originalDocument = globalThis.document;
  const originalBody = globalThis.document?.body;

  const textarea = {
    value: '',
    style: {} as Record<string, string>,
    setAttribute(name: string, value: string) {
      this[name as keyof typeof textarea] = value as never;
    },
    select() {
      selected = true;
    },
  };
  let selected = false;
  let appended: unknown = null;
  let removed: unknown = null;

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async () => {
          throw new Error('clipboard denied');
        },
      },
    },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      body: {
        appendChild(node: unknown) {
          appended = node;
        },
        removeChild(node: unknown) {
          removed = node;
        },
      },
      createElement(tagName: string) {
        assert.equal(tagName, 'textarea');
        return textarea;
      },
      execCommand(command: string) {
        assert.equal(command, 'copy');
        return true;
      },
    },
  });

  try {
    await writeClipboardText('AI 接入流程');

    assert.equal(textarea.value, 'AI 接入流程');
    assert.equal(selected, true);
    assert.equal(appended, textarea);
    assert.equal(removed, textarea);
  } finally {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    });
    if (originalDocument && originalBody && originalDocument.body !== originalBody) {
      originalDocument.body = originalBody;
    }
  }
});
