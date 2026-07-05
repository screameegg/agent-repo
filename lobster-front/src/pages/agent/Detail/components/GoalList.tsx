import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentGoal, AgentGoalCreateRequest, AgentGoalStep } from '../../types';
import {
  getCurrentGoalStep,
  getGoalProgressSummary,
  getGoalStepMarkers,
  getLatestGoalStepActivity,
  paginateItems,
} from '../../display';

interface GoalListProps {
  goals: AgentGoal[];
  onCreateGoal: (data: AgentGoalCreateRequest) => Promise<void>;
  onUpdateGoal: (goalId: string, data: AgentGoalCreateRequest) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

interface GoalFormState {
  title: string;
  description: string;
  goalStatus: string;
  priority: number;
  dueTime: string;
}

interface GoalEditFormState extends GoalFormState {
  steps: AgentGoalStep[];
}

const GOAL_PAGE_SIZE = 6;
const STEP_PAGE_SIZE = 6;

const statusLabel = (status?: string) => {
  if (status === 'completed') return '已完成';
  if (status === 'running') return '进行中';
  if (status === 'failed') return '阻塞';
  if (status === 'paused') return '暂停';
  return '待处理';
};

const statusBadgeClass = (status?: string) => {
  if (status === 'completed') return 'bg-[#E8F5E9] text-[#1B5E20]';
  if (status === 'running') return 'bg-[#FFF8D8] text-[#1A1A1A]';
  if (status === 'failed') return 'bg-[#FFEDEB] text-[#B42318]';
  if (status === 'paused') return 'bg-[#E3F2FD] text-[#0D47A1]';
  return 'bg-[#F5F5F5] text-[#555]';
};

const stepNodeClass = (state?: string, active?: boolean) => {
  const base = active ? 'ring-4 ring-[#FFD93D]/60' : '';
  if (state === 'completed') return `${base} bg-[#4CAF50] text-white`;
  if (state === 'running') return `${base} bg-[#FFD93D] text-[#1A1A1A]`;
  if (state === 'failed') return `${base} bg-[#FF6B6B] text-white`;
  return `${base} bg-white text-[#888]`;
};

const stepIcon = (state?: string) => {
  if (state === 'completed') return <CheckCircle2 className="w-4 h-4" />;
  if (state === 'running') return <Clock3 className="w-4 h-4" />;
  if (state === 'failed') return <AlertTriangle className="w-4 h-4" />;
  return <Circle className="w-4 h-4" />;
};

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');
const dueTimePayload = (value: string) => (value ? `${value}T23:59:59` : undefined);

const blankStep = (sortOrder: number): AgentGoalStep => ({
  id: `local-${Date.now()}-${sortOrder}`,
  title: '',
  description: '',
  status: 'pending',
  sortOrder,
});

const blankGoalForm = (): GoalFormState => ({
  title: '',
  description: '',
  goalStatus: 'pending',
  priority: 5,
  dueTime: '',
});

const editFormFromGoal = (goal: AgentGoal): GoalEditFormState => ({
  title: goal.title,
  description: goal.description || '',
  goalStatus: goal.status || 'pending',
  priority: goal.priority ?? 5,
  dueTime: toDateInput(goal.dueTime),
  steps: [...(goal.steps || [])].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)),
});

function CompactStepDots({ goal }: { goal: AgentGoal }) {
  const markers = getGoalStepMarkers(goal);
  if (markers.length === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-1.5" aria-label="步骤状态">
      {markers.map((marker) => (
        <span
          key={marker.step.id || `${marker.step.title}-${marker.index}`}
          title={`${marker.index}/${marker.total} ${marker.step.title}：${statusLabel(marker.state)}`}
          className={`w-3 h-3 rounded-full border-2 border-[#1A1A1A] ${stepNodeClass(marker.state, marker.active)}`}
        />
      ))}
    </div>
  );
}

function GoalStepTimeline({ markers }: { markers: ReturnType<typeof getGoalStepMarkers> }) {
  if (markers.length === 0) {
    return (
      <div className="py-6 text-center text-sm font-black text-[#888] border-2 border-dashed border-[#E0E0E0] rounded-xl">
        等待 AI 同步执行步骤
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {markers.map((marker) => (
        <div key={marker.step.id || `${marker.step.title}-${marker.index}`} className="grid grid-cols-[36px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center shadow-[2px_2px_0px_0px_#1A1A1A] ${stepNodeClass(marker.state, marker.active)}`}>
              {stepIcon(marker.state)}
            </div>
            {marker.index < marker.total && <div className="w-0.5 flex-1 min-h-5 bg-[#1A1A1A] mt-2" />}
          </div>
          <div className={`pb-4 ${marker.index < marker.total ? 'border-b-2 border-dashed border-[#E0E0E0]' : ''}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-[#1A1A1A]">{marker.step.title}</span>
              <span className={`px-2 py-0.5 rounded-lg border-2 border-[#1A1A1A] text-[10px] font-black ${statusBadgeClass(marker.state)}`}>
                {statusLabel(marker.state)}
              </span>
              {marker.active && <span className="text-[10px] font-black text-[#FF6B6B]">当前</span>}
              {marker.step.updatedAt && <span className="text-[10px] font-black text-[#888]">{marker.step.updatedAt}</span>}
            </div>
            {marker.step.description && (
              <p className="mt-1 text-xs font-bold text-[#666] leading-relaxed whitespace-pre-wrap">{marker.step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GoalList({ goals, onCreateGoal, onUpdateGoal, onDeleteGoal }: GoalListProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalPage, setGoalPage] = useState(1);
  const [stepPage, setStepPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<GoalFormState>(blankGoalForm());
  const [editForm, setEditForm] = useState<GoalEditFormState>({
    ...blankGoalForm(),
    steps: [] as AgentGoalStep[],
  });

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const pagedGoals = paginateItems(goals, goalPage, GOAL_PAGE_SIZE);
  const selectedMarkers = selectedGoal ? getGoalStepMarkers(selectedGoal) : [];
  const pagedStepMarkers = paginateItems(selectedMarkers, stepPage, STEP_PAGE_SIZE);

  useEffect(() => {
    setGoalPage(1);
  }, [goals.length]);

  useEffect(() => {
    setStepPage(1);
  }, [selectedGoalId]);

  useEffect(() => {
    if (!selectedGoal) return;
    setError('');
    setIsEditing(false);
    setEditForm(editFormFromGoal(selectedGoal));
  }, [
    selectedGoal?.id,
    selectedGoal?.title,
    selectedGoal?.description,
    selectedGoal?.status,
    selectedGoal?.priority,
    selectedGoal?.dueTime,
    selectedGoal?.steps,
  ]);

  const updateStep = (index: number, patch: Partial<AgentGoalStep>) => {
    setEditForm((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step),
    }));
  };

  const removeStep = (index: number) => {
    setEditForm((current) => ({
      ...current,
      steps: current.steps.filter((_, stepIndex) => stepIndex !== index),
    }));
  };

  const resetEditForm = () => {
    if (!selectedGoal) return;
    setEditForm(editFormFromGoal(selectedGoal));
    setError('');
    setIsEditing(false);
  };

  const saveSelectedGoal = async () => {
    if (!selectedGoal) return;
    if (!editForm.title.trim()) {
      setError('请填写任务标题');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await onUpdateGoal(selectedGoal.id, {
        title: editForm.title,
        description: editForm.description,
        goalStatus: editForm.goalStatus,
        priority: editForm.priority,
        dueTime: dueTimePayload(editForm.dueTime),
        steps: editForm.steps
          .filter((step) => step.title.trim())
          .map((step, index) => ({
            ...step,
            status: editForm.goalStatus === 'completed' ? 'completed' : step.status,
            sortOrder: (index + 1) * 10,
          })),
      });
      setIsEditing(false);
      setError('');
    } catch {
      setError('任务保存失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedGoal = async () => {
    if (!selectedGoal || !window.confirm('确认删除这个任务？')) return;
    try {
      setDeleting(true);
      setError('');
      await onDeleteGoal(selectedGoal.id);
      setSelectedGoalId(null);
      setIsEditing(false);
    } catch {
      setError('任务删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const renderProgressBar = (progress: number, completed: boolean) => (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-[#F5F5F5] h-2.5 rounded-full overflow-hidden border-2 border-[#1A1A1A]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full border-r-2 border-[#1A1A1A] ${completed ? 'bg-[#4CAF50]' : 'bg-[#FF6B6B]'}`}
        />
      </div>
      <span className="w-10 text-right text-xs font-black text-[#1A1A1A]">{progress}%</span>
    </div>
  );

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between gap-3 pt-2">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-2 border-2 border-[#1A1A1A] rounded-lg text-xs font-black bg-white disabled:opacity-40">上一页</button>
        <span className="text-xs font-black text-[#666]">{currentPage}/{totalPages}</span>
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-2 border-2 border-[#1A1A1A] rounded-lg text-xs font-black bg-white disabled:opacity-40">下一页</button>
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col h-full min-h-[400px] relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedGoalId ? (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base sm:text-lg font-black flex items-center gap-3 text-[#1A1A1A]">
                <div className="w-8 h-8 flex items-center justify-center bg-[#FFEDEB] rounded border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <Target className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                执行任务
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 sm:px-2 py-2 custom-scrollbar">
              {pagedGoals.items.map(goal => {
                const currentStep = getCurrentGoalStep(goal);
                const latestActivity = getLatestGoalStepActivity(goal);
                const summary = getGoalProgressSummary(goal);
                return (
                  <motion.div key={goal.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setSelectedGoalId(goal.id)} className="w-full p-4 border-2 border-[#1A1A1A] rounded-2xl bg-[#FDFCFB] hover:shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-0.5 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-sm font-bold pr-3 line-clamp-2 ${goal.status === 'completed' ? 'text-[#888]' : 'text-[#1A1A1A]'}`}>{goal.title}</span>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border-2 border-[#1A1A1A] ${statusBadgeClass(goal.status)}`}>{statusLabel(goal.status)}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#888] group-hover:text-[#1A1A1A]">
                          <Pencil className="w-3 h-3" />
                          查看
                        </span>
                      </div>
                    </div>
                    <div className="mb-3 space-y-1">
                      {currentStep ? <p className="text-xs font-bold text-[#666] truncate">当前步骤：{currentStep.title}</p> : <p className="text-xs font-bold text-[#888]">等待 AI 同步执行步骤</p>}
                      {latestActivity && <p className="text-[11px] font-black text-[#888] truncate">最近更新：{latestActivity.title}{latestActivity.updatedAt ? ` · ${latestActivity.updatedAt}` : ''}</p>}
                    </div>
                    {summary.hasSteps ? (
                      <>
                        <p className="text-[11px] font-black text-[#888]">{summary.completedSteps}/{summary.totalSteps} 步完成</p>
                        <CompactStepDots goal={goal} />
                      </>
                    ) : (
                      <div className="h-2.5 rounded-full border-2 border-dashed border-[#D0D0D0] bg-[#FAF9F6]" />
                    )}
                  </motion.div>
                );
              })}
              {goals.length === 0 && <div className="py-10 text-center text-sm font-black text-[#888]">暂无任务</div>}
              {goals.length > 0 && renderPagination(pagedGoals.currentPage, pagedGoals.totalPages, setGoalPage)}

              <motion.button type="button" onClick={() => { setError(''); setShowCreateModal(true); }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full flex items-center justify-center gap-2 py-4 mt-2 border-[3px] border-dashed border-[#E0E0E0] rounded-2xl text-sm font-black text-[#888] cursor-pointer hover:border-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-colors select-none">
                <Plus className="w-4 h-4" /> 新增任务
              </motion.button>
            </div>
          </motion.div>
        ) : selectedGoal ? (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-[#E0E0E0]">
              <button onClick={() => { setSelectedGoalId(null); setIsEditing(false); }} className="p-1.5 border-2 border-[#1A1A1A] rounded-lg hover:bg-[#F5F5F5] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all" title="返回"><ArrowLeft className="w-4 h-4 text-[#1A1A1A]" /></button>
              <h2 className="text-base font-black text-[#1A1A1A]">任务详情</h2>
              <div className="ml-auto flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button type="button" onClick={resetEditForm} disabled={saving || deleting} className="p-1.5 border-2 border-[#1A1A1A] rounded-lg bg-white hover:bg-[#F5F5F5] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-60" title="取消编辑"><RotateCcw className="w-4 h-4 text-[#1A1A1A]" /></button>
                    <button type="button" onClick={saveSelectedGoal} disabled={saving || deleting} className="p-1.5 border-2 border-[#1A1A1A] rounded-lg bg-[#E8F5E9] hover:bg-[#D7F0DA] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-60" title="保存任务"><Save className="w-4 h-4 text-[#1A1A1A]" /></button>
                  </>
                ) : (
                  <button type="button" onClick={() => setIsEditing(true)} disabled={deleting} className="p-1.5 border-2 border-[#1A1A1A] rounded-lg bg-[#FFF8D8] hover:bg-[#FFF1B8] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-60" title="编辑任务"><Pencil className="w-4 h-4 text-[#1A1A1A]" /></button>
                )}
                <button type="button" onClick={deleteSelectedGoal} disabled={saving || deleting} className="p-1.5 border-2 border-[#1A1A1A] rounded-lg bg-[#FFEDEB] hover:bg-[#FFDAD6] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-60" title="删除任务"><Trash2 className="w-4 h-4 text-[#1A1A1A]" /></button>
              </div>
            </div>

            {!isEditing ? (() => {
              const summary = getGoalProgressSummary(selectedGoal);
              const currentStep = getCurrentGoalStep(selectedGoal);
              const latestActivity = getLatestGoalStepActivity(selectedGoal);
              return (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] leading-tight">{selectedGoal.title}</h3>
                      <span className={`px-3 py-1 rounded-lg border-2 border-[#1A1A1A] text-xs font-black ${statusBadgeClass(selectedGoal.status)}`}>{statusLabel(selectedGoal.status)}</span>
                    </div>
                    {selectedGoal.description ? (
                      <p className="text-sm font-bold text-[#555] leading-relaxed whitespace-pre-wrap">{selectedGoal.description}</p>
                    ) : (
                      <p className="text-sm font-black text-[#999]">暂无任务描述</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border-2 border-[#1A1A1A] rounded-xl p-3 bg-[#FAF9F6]">
                      <div className="flex items-center gap-2 text-[11px] font-black text-[#888]"><ListChecks className="w-3.5 h-3.5" />步骤完成</div>
                      <div className="mt-2 text-xl font-black text-[#1A1A1A]">{summary.hasSteps ? `${summary.completedSteps}/${summary.totalSteps}` : '无步骤'}</div>
                      <div className="mt-1 text-[11px] font-black text-[#888]">{summary.hasSteps ? '由 AI 同步步骤推导' : '等待 AI 同步'}</div>
                    </div>
                    <div className="border-2 border-[#1A1A1A] rounded-xl p-3 bg-[#FAF9F6]">
                      <div className="flex items-center gap-2 text-[11px] font-black text-[#888]"><Flag className="w-3.5 h-3.5" />优先级</div>
                      <div className="mt-2 text-xl font-black text-[#1A1A1A]">{selectedGoal.priority ?? 5}</div>
                      <div className="mt-1 text-[11px] font-black text-[#888]">0 - 10</div>
                    </div>
                    <div className="border-2 border-[#1A1A1A] rounded-xl p-3 bg-[#FAF9F6]">
                      <div className="flex items-center gap-2 text-[11px] font-black text-[#888]"><CalendarDays className="w-3.5 h-3.5" />截止时间</div>
                      <div className="mt-2 text-sm font-black text-[#1A1A1A]">{toDateInput(selectedGoal.dueTime) || '未设置'}</div>
                      <div className="mt-1 text-[11px] font-black text-[#888]">任务周期</div>
                    </div>
                  </div>

                  {summary.hasSteps && (
                    <div className="space-y-3">
                      {renderProgressBar(summary.percent, selectedGoal.status === 'completed')}
                      {currentStep && <p className="text-xs font-black text-[#666]">当前步骤：{currentStep.title}</p>}
                      {latestActivity && <p className="text-xs font-black text-[#888]">最近更新：{latestActivity.title}{latestActivity.updatedAt ? ` · ${latestActivity.updatedAt}` : ''}</p>}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-black text-[#1A1A1A]">执行步骤</h4>
                      <span className="text-xs font-black text-[#888]">AI 每次同步可更新一个或多个步骤</span>
                    </div>
                    <GoalStepTimeline markers={pagedStepMarkers.items} />
                    {renderPagination(pagedStepMarkers.currentPage, pagedStepMarkers.totalPages, setStepPage)}
                  </div>
                  {error && <p className="text-sm font-black text-[#FF6B6B]">{error}</p>}
                </div>
              );
            })() : (() => {
              const previewGoal = { ...selectedGoal, steps: editForm.steps, status: editForm.goalStatus };
              const previewSummary = getGoalProgressSummary(previewGoal);
              return (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
                  <input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-base font-black outline-none focus:bg-white" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select value={editForm.goalStatus} onChange={(event) => setEditForm({ ...editForm, goalStatus: event.target.value })} className="px-3 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none"><option value="pending">待处理</option><option value="running">进行中</option><option value="completed">已完成</option><option value="paused">暂停</option><option value="failed">阻塞</option></select>
                    <input type="number" min={0} max={10} value={editForm.priority} onChange={(event) => setEditForm({ ...editForm, priority: Number(event.target.value) })} className="px-3 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none" />
                    <input type="date" value={editForm.dueTime} onChange={(event) => setEditForm({ ...editForm, dueTime: event.target.value })} className="px-3 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none" />
                  </div>
                  {previewSummary.hasSteps && (
                    <div className="space-y-2">
                      {renderProgressBar(previewSummary.percent, editForm.goalStatus === 'completed')}
                      <p className="text-xs font-black text-[#888]">步骤完成：{previewSummary.completedSteps}/{previewSummary.totalSteps}</p>
                    </div>
                  )}
                  <textarea rows={4} value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} placeholder="任务描述" className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none focus:bg-white resize-none custom-scrollbar" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-black text-[#1A1A1A]">执行步骤</h4>
                      <button type="button" onClick={() => setEditForm((current) => ({ ...current, steps: [...current.steps, blankStep((current.steps.length + 1) * 10)] }))} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#1A1A1A] rounded-lg text-xs font-black bg-[#FFD93D] shadow-[2px_2px_0px_0px_#1A1A1A]"><Plus className="w-3 h-3" />新增</button>
                    </div>
                    {editForm.steps.map((step, index) => (
                      <div key={step.id || index} className="p-3 border-2 border-[#1A1A1A] rounded-xl bg-[#FDFCFB] space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_36px] gap-2">
                          <input value={step.title} onChange={(event) => updateStep(index, { title: event.target.value })} placeholder={`步骤 ${index + 1}`} className="px-3 py-2 bg-white border-2 border-[#1A1A1A] rounded-lg text-sm font-bold outline-none" />
                          <select value={step.status} onChange={(event) => updateStep(index, { status: event.target.value })} className="px-2 py-2 bg-white border-2 border-[#1A1A1A] rounded-lg text-xs font-black outline-none"><option value="pending">待处理</option><option value="running">进行中</option><option value="completed">已完成</option><option value="failed">阻塞</option></select>
                          <button type="button" onClick={() => removeStep(index)} className="h-9 border-2 border-[#1A1A1A] rounded-lg bg-[#FFEDEB] flex items-center justify-center" title="删除步骤"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <textarea rows={2} value={step.description || ''} onChange={(event) => updateStep(index, { description: event.target.value })} placeholder="步骤描述" className="w-full px-3 py-2 bg-white border-2 border-[#1A1A1A] rounded-lg text-sm font-bold outline-none resize-none" />
                      </div>
                    ))}
                    {editForm.steps.length === 0 && <div className="py-6 text-center text-sm font-black text-[#888] border-2 border-dashed border-[#E0E0E0] rounded-xl">暂无步骤</div>}
                  </div>
                  {error && <p className="text-sm font-black text-[#FF6B6B]">{error}</p>}
                </div>
              );
            })()}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[6px_6px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]" title="关闭"><X className="w-5 h-5 text-[#1A1A1A]" /></button>
              <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] mb-6 pr-12">新增任务</h3>
              <div className="space-y-4">
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="任务标题" className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none focus:bg-white" />
                <textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="任务描述" className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none focus:bg-white resize-none custom-scrollbar" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select value={form.goalStatus} onChange={(event) => setForm({ ...form, goalStatus: event.target.value })} className="px-3 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none"><option value="pending">待处理</option><option value="running">进行中</option><option value="completed">已完成</option><option value="paused">暂停</option><option value="failed">阻塞</option></select>
                  <input type="number" min={0} max={10} value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} className="px-3 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none" />
                  <input type="date" value={form.dueTime} onChange={(event) => setForm({ ...form, dueTime: event.target.value })} className="px-3 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none" />
                </div>
              </div>
              {error && <p className="mt-4 text-sm font-black text-[#FF6B6B]">{error}</p>}
              <button onClick={async () => {
                if (!form.title.trim()) { setError('请填写任务标题'); return; }
                try {
                  setSaving(true); setError('');
                  await onCreateGoal({ title: form.title, description: form.description, goalStatus: form.goalStatus, priority: form.priority, dueTime: dueTimePayload(form.dueTime), steps: [] });
                  setForm(blankGoalForm());
                  setShowCreateModal(false);
                } catch { setError('任务保存失败'); } finally { setSaving(false); }
              }} disabled={saving} className="mt-6 w-full py-3 bg-[#1A1A1A] text-white font-black rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#FFD93D] disabled:opacity-70">{saving ? '保存中...' : '保存任务'}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}