import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackStatusText, feedbackTypeText, npsSegment } from './feedbackPresentation';

test('maps feedback status and type labels for admin display', () => {
  assert.equal(feedbackStatusText('open'), '待处理');
  assert.equal(feedbackStatusText('reviewed'), '已查看');
  assert.equal(feedbackStatusText('closed'), '已关闭');
  assert.equal(feedbackStatusText('custom'), 'custom');
  assert.equal(feedbackTypeText('nps'), 'NPS');
  assert.equal(feedbackTypeText('general'), '反馈');
});

test('classifies nps scores into promoter passive and detractor buckets', () => {
  assert.equal(npsSegment(10), '推荐者');
  assert.equal(npsSegment(8), '中立者');
  assert.equal(npsSegment(6), '批评者');
  assert.equal(npsSegment(null), '-');
});
