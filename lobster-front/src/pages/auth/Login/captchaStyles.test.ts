import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captchaImageClassName,
  captchaImageButtonClassName,
  captchaFieldRowClassName,
} from './captchaStyles';

test('captcha image preserves the full captcha instead of cropping characters', () => {
  assert.match(captchaImageClassName, /\bobject-contain\b/);
  assert.doesNotMatch(captchaImageClassName, /\bobject-cover\b/);
});

test('captcha image button has enough width for four character captcha images', () => {
  assert.match(captchaImageButtonClassName, /\bw-32\b/);
  assert.match(captchaImageButtonClassName, /\bsm:w-36\b/);
});

test('captcha field stacks on narrow screens to avoid squeezing the image', () => {
  assert.match(captchaFieldRowClassName, /\bflex-col\b/);
  assert.match(captchaFieldRowClassName, /\bsm:flex-row\b/);
});
