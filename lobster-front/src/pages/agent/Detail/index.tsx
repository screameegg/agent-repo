import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import IdentityCard from './components/IdentityCard';
import SkillRing from './components/SkillRing';
import MemoryList from './components/MemoryList';
import GoalList from './components/GoalList';
import { motion, AnimatePresence } from 'motion/react';
import { Agent, AgentGoal, AgentGoalCreateRequest, AgentMemory, AgentSkill, AgentSkillMount } from '../types';
import {
  createAgentGoalApi,
  createAgentMemoryApi,
  deleteAgentGoalApi,
  deleteAgentMemoryApi,
  getAgentProfileApi,
  listAgentGoalsApi,
  listAgentSkillMountsApi,
  listAgentSkillsApi,
  listAgentMemoriesApi,
  mountAgentSkillApi,
  unmountAgentSkillApi,
  updateAgentGoalApi,
} from '../service';
import { SkillPackage } from '../../skill/Editor/types';
import Toast, { ToastState } from '../../../components/Toast';

export default function AgentDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'skills' | 'memories' | 'goals'>('skills');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [skillMounts, setSkillMounts] = useState<AgentSkillMount[]>([]);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [goals, setGoals] = useState<AgentGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Record<'skills' | 'memories' | 'goals', boolean>>({
    skills: false,
    memories: false,
    goals: false,
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadProfile = async () => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      setProfileError(null);
      const res = await getAgentProfileApi(id);
      if (res.code === 200) {
        setAgent(res.data);
      } else {
        setProfileError(res.message || 'Agent详情加载失败');
      }
    } catch {
      setProfileError('Agent详情加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAgent(null);
    setSkills([]);
    setSkillMounts([]);
    setMemories([]);
    setGoals([]);
    setLoadedTabs({ skills: false, memories: false, goals: false });
    void loadProfile();
  }, [id]);

  const loadSkills = async (options?: { force?: boolean }) => {
    if (!id || (loadedTabs.skills && !options?.force)) {
      return;
    }
    try {
      setTabLoading(true);
      setTabError(null);
      const [skillsRes, mountsRes] = await Promise.all([
        listAgentSkillsApi(id),
        listAgentSkillMountsApi(id),
      ]);
      if (skillsRes.code === 200 && mountsRes.code === 200) {
        setSkills(skillsRes.data);
        setSkillMounts(mountsRes.data);
        setLoadedTabs((current) => ({ ...current, skills: true }));
      } else {
        setTabError(skillsRes.message || mountsRes.message || '技能配置加载失败');
      }
    } catch {
      setTabError('技能配置加载失败');
    } finally {
      setTabLoading(false);
    }
  };

  const loadMemories = async () => {
    if (!id || loadedTabs.memories) {
      return;
    }
    try {
      setTabLoading(true);
      setTabError(null);
      const res = await listAgentMemoriesApi(id);
      if (res.code === 200) {
        setMemories(res.data);
        setLoadedTabs((current) => ({ ...current, memories: true }));
      } else {
        setTabError(res.message || '记忆加载失败');
      }
    } catch {
      setTabError('记忆加载失败');
    } finally {
      setTabLoading(false);
    }
  };

  const loadMemoriesFresh = async () => {
    if (!id) {
      return;
    }
    setLoadedTabs((current) => ({ ...current, memories: false }));
    try {
      setTabLoading(true);
      setTabError(null);
      const res = await listAgentMemoriesApi(id);
      if (res.code === 200) {
        setMemories(res.data);
        setLoadedTabs((current) => ({ ...current, memories: true }));
      } else {
        setTabError(res.message || '记忆加载失败');
      }
    } catch {
      setTabError('记忆加载失败');
    } finally {
      setTabLoading(false);
    }
  };

  const loadGoals = async () => {
    if (!id || loadedTabs.goals) {
      return;
    }
    try {
      setTabLoading(true);
      setTabError(null);
      const res = await listAgentGoalsApi(id);
      if (res.code === 200) {
        setGoals(res.data);
        setLoadedTabs((current) => ({ ...current, goals: true }));
      } else {
        setTabError(res.message || '任务加载失败');
      }
    } catch {
      setTabError('任务加载失败');
    } finally {
      setTabLoading(false);
    }
  };

  const loadGoalsFresh = async () => {
    if (!id) {
      return;
    }
    setLoadedTabs((current) => ({ ...current, goals: false }));
    try {
      setTabLoading(true);
      setTabError(null);
      const res = await listAgentGoalsApi(id);
      if (res.code === 200) {
        setGoals(res.data);
        setLoadedTabs((current) => ({ ...current, goals: true }));
      } else {
        setTabError(res.message || '任务加载失败');
      }
    } catch {
      setTabError('任务加载失败');
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'skills') {
      void loadSkills();
    } else if (activeTab === 'memories') {
      void loadMemories();
    } else if (activeTab === 'goals') {
      void loadGoals();
    }
  }, [activeTab, id, loadedTabs.skills, loadedTabs.memories, loadedTabs.goals]);

  const handleMountSkill = async (skill: SkillPackage) => {
    if (!id) return;
    const res = await mountAgentSkillApi(id, {
      skillId: skill.id,
      mountStatus: 'active',
      configJson: JSON.stringify({
        skillId: skill.id,
        code: skill.code,
        version: skill.version || '1.0.0',
      }),
    });
    if (res.code !== 200) {
      throw new Error(res.message || '挂载失败');
    }
    await loadSkills({ force: true });
    await loadProfile();
    setToast({ type: 'success', message: '挂载成功，Agent 下次同步会拉取新的技能配置。' });
  };

  const handleUnmountSkill = async (skillId: string) => {
    if (!id) return;
    const res = await unmountAgentSkillApi(id, skillId);
    if (res.code !== 200) {
      throw new Error(res.message || '卸载失败');
    }
    await loadSkills({ force: true });
    await loadProfile();
    setToast({ type: 'success', message: '卸载成功，已生成待同步配置变更。' });
  };

  const handleCreateMemory = async (data: {
    title: string;
    content: string;
    memoryType?: string;
    importance?: number;
    source?: string;
  }) => {
    if (!id) return;
    const res = await createAgentMemoryApi(id, data);
    if (res.code !== 200) {
      throw new Error(res.message || '记忆保存失败');
    }
    await loadMemoriesFresh();
    await loadProfile();
  };


  const handleDeleteMemory = async (memoryId: string) => {
    if (!id) return;
    const res = await deleteAgentMemoryApi(id, memoryId);
    if (res.code !== 200) {
      throw new Error(res.message || '记忆删除失败');
    }
    await loadMemoriesFresh();
    await loadProfile();
    setToast({ type: 'success', message: '记忆已删除，已生成待同步配置变更。' });
  };
  const handleCreateGoal = async (data: {
    title: string;
    description?: string;
    goalStatus?: string;
    priority?: number;
    dueTime?: string;
  }) => {
    if (!id) return;
    const res = await createAgentGoalApi(id, data);
    if (res.code !== 200) {
      throw new Error(res.message || '任务保存失败');
    }
    await loadGoalsFresh();
    await loadProfile();
  };


  const handleUpdateGoal = async (goalId: string, data: AgentGoalCreateRequest) => {
    if (!id) return;
    const res = await updateAgentGoalApi(id, goalId, data);
    if (res.code !== 200) {
      throw new Error(res.message || '任务保存失败');
    }
    await loadGoalsFresh();
    await loadProfile();
    setToast({ type: 'success', message: '任务已更新，已生成待同步配置变更。' });
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!id) return;
    const res = await deleteAgentGoalApi(id, goalId);
    if (res.code !== 200) {
      throw new Error(res.message || '任务删除失败');
    }
    await loadGoalsFresh();
    await loadProfile();
    setToast({ type: 'success', message: '任务已删除，已生成待同步配置变更。' });
  };
  if (loading) {
    return <p className="text-sm font-black text-[#888]">Agent详情加载中...</p>;
  }

  if (profileError || !agent) {
    return <p className="text-sm font-black text-[#FF6B6B]">{profileError || 'Agent不存在'}</p>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

    const tabs = [
      { id: 'skills', label: '技能配置' },
      { id: 'memories', label: '记忆管理' },
      { id: 'goals', label: '执行任务' }
    ] as const;

  return (
    <>
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="space-y-4 sm:space-y-6 pb-12 max-w-5xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b-2 border-[#1A1A1A] pb-5 sm:pb-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/app" className="p-2 border-2 border-[#1A1A1A] rounded-lg hover:bg-gray-50 shadow-[2px_2px_0px_0px_#1A1A1A] transition-all shrink-0">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A]" />
          </Link>
          <span className="text-lg sm:text-xl font-bold text-[#888]">/</span>
          <h2 className="text-lg sm:text-2xl font-black text-[#1A1A1A] truncate">{agent.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:flex lg:gap-4">
          <button className="min-h-11 px-3 sm:px-5 py-2.5 bg-white border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_#1A1A1A] transition-all">
            训练 Agent
          </button>
          <button className="min-h-11 px-3 sm:px-5 py-2.5 bg-[#FF6B6B] text-white border-2 border-[#1A1A1A] rounded-xl font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-0.5 transition-all">
            导出资产
          </button>
        </div>
      </motion.div>

      <div className="flex flex-col gap-6">
        <motion.div variants={itemVariants}>
           <IdentityCard agent={agent} />
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex gap-2 sm:gap-4 border-b-2 border-[#1A1A1A] overflow-x-auto custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-w-[6rem] px-4 sm:px-6 py-3 font-black text-sm -mb-0.5 border-b-4 transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#888] hover:text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="flex-1 flex flex-col pt-2 sm:pt-4 min-h-[400px]">
          {tabError && (
            <div className="mb-4 p-3 text-sm font-black text-[#B42318] bg-[#FFF0F0] border-2 border-[#FF6B6B] rounded-xl">
              {tabError}
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'skills' && (
              <motion.div key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                {tabLoading && !loadedTabs.skills ? <p className="text-sm font-black text-[#888]">技能配置加载中...</p> : <SkillRing agent={agent} skills={skills} skillMounts={skillMounts} onMountSkill={handleMountSkill} onUnmountSkill={handleUnmountSkill} onToast={setToast} />}
              </motion.div>
            )}
            {activeTab === 'memories' && (
              <motion.div key="memories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                {tabLoading && !loadedTabs.memories ? <p className="text-sm font-black text-[#888]">记忆加载中...</p> : <MemoryList memories={memories} onCreateMemory={handleCreateMemory} onDeleteMemory={handleDeleteMemory} />}
              </motion.div>
            )}
            {activeTab === 'goals' && (
              <motion.div key="goals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                {tabLoading && !loadedTabs.goals ? <p className="text-sm font-black text-[#888]">任务加载中...</p> : <GoalList goals={goals} onCreateGoal={handleCreateGoal} onUpdateGoal={handleUpdateGoal} onDeleteGoal={handleDeleteGoal} />}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
    <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
