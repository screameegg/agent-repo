import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAgentSkillStats,
  getGoalProgress,
  getCurrentGoalStep,
  getGoalProgressSummary,
  getGoalStepMarkers,
  getLatestGoalStepActivity,
  paginateItems,
  getSyncedCapabilitySnapshots,
} from './display';
import { Agent, AgentGoal } from './types';

test('separates mounted skill count from synced skill snapshots', () => {
  const agent = {
    skillCount: 19,
    mountedSkillCount: 0,
  } as Agent;

  const stats = getAgentSkillStats(agent);

  assert.equal(stats.mountedCount, 0);
  assert.equal(stats.snapshotCount, 19);
  assert.equal(stats.mountedLabel, '0 挂载');
  assert.equal(stats.snapshotLabel, '19 能力');
});

test('filters synced capability snapshots for reference modal', () => {
  const skills = [
    { id: '1', name: '平台挂载技能', description: 'managed', sourceType: 'skill_package', status: 'active' },
    { id: '2', name: '代码审查', description: 'review changes', sourceType: 'custom', status: 'active' },
    { id: '3', name: '文档整理', description: 'write docs', sourceType: 'agent-sync', status: 'active' },
  ];

  const snapshots = getSyncedCapabilitySnapshots(skills, '文档');

  assert.deepEqual(snapshots.map((item) => item.id), ['3']);
});
test('calculates goal progress from completed steps', () => {
  const goal = {
    status: 'running',
    steps: [
      { id: 's1', title: '准备', status: 'completed', sortOrder: 10 },
      { id: 's2', title: '执行', status: 'running', sortOrder: 20 },
      { id: 's3', title: '复核', status: 'pending', sortOrder: 30 },
    ],
  } as AgentGoal;

  assert.equal(getGoalProgress(goal), 33);
  assert.equal(getCurrentGoalStep(goal)?.title, '执行');
});

test('builds step-driven progress summary for goal detail', () => {
  const goal = {
    status: 'running',
    steps: [
      { id: 's3', title: '发布', status: 'pending', sortOrder: 30 },
      { id: 's1', title: '计划', status: 'completed', sortOrder: 10 },
      { id: 's2', title: '实现', status: 'running', sortOrder: 20 },
      { id: 'blank', title: ' ', status: 'completed', sortOrder: 5 },
    ],
  } as AgentGoal;

  assert.deepEqual(getGoalProgressSummary(goal), {
    percent: 33,
    completedSteps: 1,
    totalSteps: 3,
    hasSteps: true,
  });
});

test('marks ordered goal step nodes and the active step', () => {
  const goal = {
    status: 'running',
    steps: [
      { id: 's3', title: '发布', status: 'pending', sortOrder: 30 },
      { id: 's1', title: '计划', status: 'completed', sortOrder: 10 },
      { id: 's2', title: '实现', status: 'running', sortOrder: 20 },
    ],
  } as AgentGoal;

  const markers = getGoalStepMarkers(goal);

  assert.deepEqual(
    markers.map((marker) => ({
      title: marker.step.title,
      state: marker.state,
      active: marker.active,
      index: marker.index,
      total: marker.total,
    })),
    [
      { title: '计划', state: 'completed', active: false, index: 1, total: 3 },
      { title: '实现', state: 'running', active: true, index: 2, total: 3 },
      { title: '发布', state: 'pending', active: false, index: 3, total: 3 },
    ]
  );
});

test('completed goal displays complete progress even when steps lag behind', () => {
  const goal = {
    status: 'completed',
    steps: [
      { id: 's1', title: '准备', status: 'completed', sortOrder: 10 },
      { id: 's2', title: '执行', status: 'running', sortOrder: 20 },
      { id: 's3', title: '复核', status: 'pending', sortOrder: 30 },
    ],
  } as AgentGoal;

  assert.equal(getGoalProgress(goal), 100);
  assert.equal(getCurrentGoalStep(goal), undefined);
});

test('does not invent numeric progress when a goal has no steps', () => {
  assert.equal(getGoalProgress({ status: 'completed' } as AgentGoal), 100);
  assert.equal(getGoalProgress({ status: 'running' } as AgentGoal), 0);
  assert.equal(getGoalProgress({ status: 'failed' } as AgentGoal), 0);
  assert.equal(getGoalProgress({ status: 'pending' } as AgentGoal), 0);
  assert.deepEqual(getGoalProgressSummary({ status: 'running' } as AgentGoal), {
    percent: 0,
    completedSteps: 0,
    totalSteps: 0,
    hasSteps: false,
  });
});

test('finds the latest goal step activity for task detail metadata', () => {
  const goal = {
    status: 'running',
    steps: [
      { id: 's1', title: '准备', status: 'completed', sortOrder: 10, updatedAt: '2026-07-01T09:00:00' },
      { id: 's2', title: '执行', status: 'running', sortOrder: 20, updatedAt: '2026-07-02T10:00:00' },
      { id: 's3', title: '复核', status: 'pending', sortOrder: 30 },
    ],
  } as AgentGoal;

  const activity = getLatestGoalStepActivity(goal);

  assert.equal(activity?.title, '执行');
  assert.equal(activity?.updatedAt, '2026-07-02T10:00:00');
});

test('paginates task lists without overflowing the goal panel', () => {
  const result = paginateItems(['a', 'b', 'c', 'd', 'e'], 3, 2);

  assert.deepEqual(result.items, ['e']);
  assert.equal(result.currentPage, 3);
  assert.equal(result.totalPages, 3);
  assert.equal(result.totalItems, 5);
});
