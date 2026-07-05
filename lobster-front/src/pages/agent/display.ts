import { Agent, AgentGoal, AgentGoalStep, AgentSkill } from './types';

export interface AgentSkillStats {
  mountedCount: number;
  snapshotCount: number;
  mountedLabel: string;
  snapshotLabel: string;
}

export interface GoalProgressSummary {
  percent: number;
  completedSteps: number;
  totalSteps: number;
  hasSteps: boolean;
}

export interface GoalStepMarker {
  step: AgentGoalStep;
  state: string;
  active: boolean;
  index: number;
  total: number;
}

export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export function getAgentSkillStats(agent: Pick<Agent, 'skillCount' | 'mountedSkillCount'>): AgentSkillStats {
  const mountedCount = agent.mountedSkillCount ?? 0;
  const snapshotCount = agent.skillCount ?? 0;

  return {
    mountedCount,
    snapshotCount,
    mountedLabel: `${mountedCount} 挂载`,
    snapshotLabel: `${snapshotCount} 能力`,
  };
}

export function getSyncedCapabilitySnapshots(skills: AgentSkill[], keyword = ''): AgentSkill[] {
  const query = keyword.trim().toLowerCase();
  return skills
    .filter((skill) => skill.sourceType !== 'skill_package')
    .filter((skill) => {
      if (!query) {
        return true;
      }
      return `${skill.name} ${skill.description} ${skill.sourceType || ''}`.toLowerCase().includes(query);
    });
}

function getOrderedGoalSteps(goal: Pick<AgentGoal, 'steps'>): AgentGoalStep[] {
  return [...(goal.steps || [])]
    .filter((step) => step.title?.trim())
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

export function getGoalProgress(goal: Pick<AgentGoal, 'status' | 'steps'>): number {
  if (goal.status === 'completed') {
    return 100;
  }
  const steps = getOrderedGoalSteps(goal);
  if (steps.length > 0) {
    const completed = steps.filter((step) => step.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  }
  return 0;
}

export function getGoalProgressSummary(goal: Pick<AgentGoal, 'status' | 'steps'>): GoalProgressSummary {
  const steps = getOrderedGoalSteps(goal);
  const completedSteps = goal.status === 'completed'
    ? steps.length
    : steps.filter((step) => step.status === 'completed').length;

  return {
    percent: getGoalProgress(goal),
    completedSteps,
    totalSteps: steps.length,
    hasSteps: steps.length > 0,
  };
}

export function getCurrentGoalStep(goal: Pick<AgentGoal, 'status' | 'steps'>): AgentGoalStep | undefined {
  if (goal.status === 'completed') {
    return undefined;
  }
  const steps = getOrderedGoalSteps(goal);
  return steps.find((step) => step.status === 'running') || steps.find((step) => step.status !== 'completed');
}

export function getGoalStepMarkers(goal: Pick<AgentGoal, 'status' | 'steps'>): GoalStepMarker[] {
  const steps = getOrderedGoalSteps(goal);
  const currentStep = getCurrentGoalStep(goal);

  return steps.map((step, index) => ({
    step,
    state: goal.status === 'completed' ? 'completed' : step.status,
    active: Boolean(currentStep && currentStep === step),
    index: index + 1,
    total: steps.length,
  }));
}

export function getLatestGoalStepActivity(goal: Pick<AgentGoal, 'steps'>): AgentGoalStep | undefined {
  const steps = getOrderedGoalSteps(goal).filter((step) => step.updatedAt);
  return steps.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))[0];
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): PaginationResult<T> {
  const safePageSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    currentPage,
    totalPages,
    totalItems,
    pageSize: safePageSize,
  };
}