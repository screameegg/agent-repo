import React, { useEffect, useState } from 'react';
import { Agent } from '../../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Plus, X, Store, ArrowLeft, Globe, Lock, CheckCircle2, Loader2, Trash2, Search, Layers3 } from 'lucide-react';
import { AgentSkill, AgentSkillMount } from '../../types';
import { listInstalledSkillsApi, listMySkillsApi } from '../../../skill/service';
import { SkillPackage } from '../../../skill/Editor/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { ToastState } from '../../../../components/Toast';
import { getSyncedCapabilitySnapshots } from '../../display';

interface SkillRingProps {
  agent: Agent;
  skills: AgentSkill[];
  skillMounts: AgentSkillMount[];
  onMountSkill: (skill: SkillPackage) => Promise<void>;
  onUnmountSkill: (skillId: string) => Promise<void>;
  onToast: (toast: ToastState) => void;
}

export default function SkillRing({ agent, skills, skillMounts, onMountSkill, onUnmountSkill, onToast }: SkillRingProps) {
  const [showManageModal, setShowManageModal] = useState(false);
  const [showSnapshotsModal, setShowSnapshotsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'created'>('installed');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedSkill, setSelectedSkill] = useState<SkillPackage | null>(null);
  const [pendingUnmount, setPendingUnmount] = useState<AgentSkillMount | null>(null);
  const [snapshotKeyword, setSnapshotKeyword] = useState('');
  const [installedSkills, setInstalledSkills] = useState<SkillPackage[]>([]);
  const [createdSkills, setCreatedSkills] = useState<SkillPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounting, setMounting] = useState(false);
  const [unmountingId, setUnmountingId] = useState<string | null>(null);

  const currentList = activeTab === 'installed' ? installedSkills : createdSkills;
  const syncedSkills = getSyncedCapabilitySnapshots(skills);
  const visibleSyncedSkills = getSyncedCapabilitySnapshots(skills, snapshotKeyword);

  const loadSkillSources = async () => {
    try {
      setLoading(true);
      const [installedRes, createdRes] = await Promise.all([
        listInstalledSkillsApi({ current: 1, size: 100 }),
        listMySkillsApi({ current: 1, size: 100 }),
      ]);
      if (installedRes.code === 200) {
        setInstalledSkills(installedRes.data.records);
      }
      if (createdRes.code === 200) {
        setCreatedSkills(createdRes.data.records);
      }
      if (installedRes.code !== 200 || createdRes.code !== 200) {
        onToast({ type: 'error', message: installedRes.message || createdRes.message || '技能列表加载失败' });
      }
    } catch {
      onToast({ type: 'error', message: '技能列表加载失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnmount = async () => {
    if (!pendingUnmount) {
      return;
    }
    try {
      setUnmountingId(pendingUnmount.skillId);
      await onUnmountSkill(pendingUnmount.skillId);
      setPendingUnmount(null);
    } catch (error) {
      onToast({ type: 'error', message: error instanceof Error ? error.message : '卸载失败' });
    } finally {
      setUnmountingId(null);
    }
  };

  useEffect(() => {
    if (showManageModal) {
      void loadSkillSources();
    }
  }, [showManageModal]);

  const openManageModal = () => {
    setShowManageModal(true);
    setView('list');
    setActiveTab('installed');
    setSelectedSkill(null);
  };

  const closeManageModal = () => {
    setShowManageModal(false);
    setView('list');
    setSelectedSkill(null);
  };

  const handleMount = async () => {
    if (!selectedSkill) {
      return;
    }
    try {
      setMounting(true);
      await onMountSkill(selectedSkill);
      window.setTimeout(closeManageModal, 500);
    } catch (error) {
      onToast({ type: 'error', message: error instanceof Error ? error.message : '挂载失败' });
    } finally {
      setMounting(false);
    }
  };

  return (
    <>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col h-full min-h-[400px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full mb-5 sm:mb-6 relative z-10">
          <h2 className="text-base sm:text-lg font-black flex items-center gap-3 text-[#1A1A1A]">
            <div className="w-8 h-8 flex items-center justify-center bg-[#FFF4E0] rounded border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
              <Network className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            核心技能挂载区
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:shrink-0">
            <button
              onClick={() => setShowSnapshotsModal(true)}
              className="min-h-10 flex items-center justify-center px-3 sm:px-4 py-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-xs cursor-pointer"
            >
              <Layers3 className="w-3 h-3 mr-1" />
              已同步能力 {syncedSkills.length}
            </button>
            <button
              onClick={openManageModal}
              className="min-h-10 flex items-center justify-center px-3 sm:px-4 py-2 bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-xs cursor-pointer"
            >
              <Plus className="w-3 h-3 mr-1" />
              新增挂载
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto sm:pr-2 custom-scrollbar sm:-ml-1 sm:pl-1 sm:-mr-3 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
            {skillMounts.map((skill, index) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center p-3 bg-[#FDFCFB] border-2 border-[#1A1A1A] rounded-2xl hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all group"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-white border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] mr-3 group-hover:bg-[#FFF4E0] transition-colors relative shrink-0">
                  <Network className="w-5 h-5 text-[#1A1A1A]" />
                  <span className={`absolute -top-1 -right-1 w-3 h-3 border-2 border-[#1A1A1A] rounded-full shadow-sm ${skill.mountStatus === 'active' ? 'bg-[#4CAF50]' : 'bg-[#FFD93D]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="text-sm font-black text-[#1A1A1A] truncate">{skill.name}</h3>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#E0E0E0] ${skill.mountStatus === 'active' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFFDE7] text-[#F57F17]'}`}>
                        {skill.mountStatus === 'active' ? '运行中' : '待命'}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingUnmount(skill);
                        }}
                        disabled={unmountingId === skill.skillId}
                        className="p-1 bg-white border border-[#FF6B6B] text-[#FF6B6B] rounded-md hover:bg-[#FF6B6B] hover:text-white transition-colors disabled:opacity-60"
                        title="卸载技能"
                      >
                        {unmountingId === skill.skillId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-[#888] truncate">{skill.description}</p>
                </div>
              </motion.div>
            ))}
            {skillMounts.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm font-black text-[#888]">
                暂无挂载技能，给 {agent.name} 添加一个技能开始组合。
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSnapshotsModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FAF9F6] border-4 border-[#1A1A1A] rounded-3xl w-full max-w-3xl h-[88vh] sm:h-auto sm:max-h-[82vh] shadow-[6px_6px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] relative flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 border-b-2 border-[#1A1A1A] bg-white px-4 sm:px-6 py-4 sm:py-5 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-[#1A1A1A]">Agent 已同步能力</h3>
                  <p className="text-xs font-bold text-[#888] mt-1">来自 Agent 自身同步上报，仅作为挂载参考。</p>
                </div>
                <button
                  onClick={() => setShowSnapshotsModal(false)}
                  className="p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A] shrink-0"
                >
                  <X className="w-5 h-5 text-[#1A1A1A]" />
                </button>
              </div>

              <div className="p-4 sm:p-6 border-b-2 border-dashed border-[#E0E0E0] bg-[#FDFCFB] shrink-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
                  <input
                    value={snapshotKeyword}
                    onChange={(event) => setSnapshotKeyword(event.target.value)}
                    placeholder="搜索能力名称、描述或来源"
                    className="w-full h-11 pl-11 pr-4 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none focus:shadow-[3px_3px_0px_0px_#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                {visibleSyncedSkills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleSyncedSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center p-3 bg-[#F6FAFF] border-2 border-[#1A1A1A] rounded-2xl"
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-white border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] mr-3 shrink-0">
                          <Network className="w-4 h-4 text-[#1A1A1A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h4 className="text-sm font-black text-[#1A1A1A] truncate">{skill.name}</h4>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[#90CAF9] bg-[#E3F2FD] text-[#1565C0] shrink-0">
                              {skill.sourceType || 'sync'}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-[#888] truncate">{skill.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-sm font-black text-[#888]">
                    {syncedSkills.length === 0 ? '暂无 Agent 自同步能力。' : '没有匹配的能力。'}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showManageModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FAF9F6] border-4 border-[#1A1A1A] rounded-3xl w-full max-w-4xl h-[90vh] sm:h-[85vh] shadow-[6px_6px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] relative flex flex-col overflow-hidden"
            >
              <div className="flex border-b-2 border-[#1A1A1A] bg-white shrink-0">
                <div className="flex-1 flex px-4 sm:px-8 pt-5 sm:pt-6 gap-4 sm:gap-8 items-end overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => { setView('list'); setActiveTab('installed'); setSelectedSkill(null); }}
                    className={`pb-4 text-base sm:text-xl font-black border-b-4 transition-all shrink-0 ${activeTab === 'installed' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#888] hover:text-[#1A1A1A]'}`}
                  >
                    已安装技能
                  </button>
                  <button
                    onClick={() => { setView('list'); setActiveTab('created'); setSelectedSkill(null); }}
                    className={`pb-4 text-base sm:text-xl font-black border-b-4 transition-all shrink-0 ${activeTab === 'created' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#888] hover:text-[#1A1A1A]'}`}
                  >
                    我创建的
                  </button>
                </div>
                <div className="p-4">
                  <button
                    onClick={closeManageModal}
                    className="p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
                  >
                    <X className="w-5 h-5 text-[#1A1A1A]" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                {view === 'list' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {loading ? (
                      <div className="py-16 flex items-center justify-center gap-2 text-sm font-black text-[#888]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        技能加载中...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentList.map((skill) => (
                          <button
                            key={`${activeTab}-${skill.id}`}
                            onClick={() => { setSelectedSkill(skill); setView('detail'); }}
                            className="text-left bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all cursor-pointer flex flex-col group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-12 h-12 flex items-center justify-center border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] bg-[#FDFCFB] group-hover:bg-[#FFF4E0] transition-colors">
                                <Store className="w-5 h-5 text-[#1A1A1A]" />
                              </div>
                              {skill.publishStatus === 'published' ? (
                                <span className="flex items-center text-[10px] bg-[#E3F2FD] text-[#1565C0] border border-[#90CAF9] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                  <Globe className="w-3 h-3 mr-1" /> 已发布
                                </span>
                              ) : (
                                <span className="flex items-center text-[10px] bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                  <Lock className="w-3 h-3 mr-1" /> 私有
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-black text-[#1A1A1A] truncate">{skill.name}</h3>
                            <p className="text-xs font-bold text-[#888] mt-1 line-clamp-2 leading-relaxed">{skill.description}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {!loading && currentList.length === 0 && (
                      <div className="py-16 text-center text-sm font-black text-[#888]">
                        {activeTab === 'installed' ? '暂无已安装技能，先去技能市场安装。' : '暂无你创建的技能，先到技能编辑器创建。'}
                      </div>
                    )}
                  </motion.div>
                )}

                {view === 'detail' && selectedSkill && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto bg-white p-5 sm:p-8 rounded-3xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A]">
                    <button
                      onClick={() => setView('list')}
                      className="flex items-center text-sm font-bold text-[#888] hover:text-[#1A1A1A] mb-8 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> 返回列表
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6 border-b-2 border-dashed border-[#E0E0E0] pb-6 sm:pb-8 mb-6 sm:mb-8">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center border-4 border-[#1A1A1A] rounded-2xl bg-[#FDFCFB] shadow-[4px_4px_0px_0px_#1A1A1A]">
                        <Store className="w-10 h-10 text-[#1A1A1A]" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] break-words">{selectedSkill.name}</h2>
                        <p className="text-sm font-bold text-[#888] mt-2 mb-4 leading-relaxed">{selectedSkill.description || '暂无描述'}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-bold px-3 py-1 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-lg">版本 {selectedSkill.version || '1.0.0'}</span>
                          <span className="text-xs font-bold px-3 py-1 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-lg">作者: {selectedSkill.author}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-black text-[#1A1A1A]">挂载说明</h4>
                      <p className="text-sm font-medium text-[#2D2D2D] leading-relaxed">
                        挂载后会在当前 Agent 下创建一个技能快照，并记录源技能包 ID、编码和版本。Agent 同步配置时可以读取这些技能组合。
                      </p>
                    </div>

                    <button
                      onClick={handleMount}
                      disabled={mounting}
                      className="mt-10 w-full flex justify-center items-center bg-[#FFD93D] text-[#1A1A1A] font-black py-4 rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] disabled:opacity-70"
                    >
                      {mounting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      {mounting ? '挂载中...' : '挂载到当前 Agent'}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!pendingUnmount}
        title="卸载技能"
        description={`确定要从 ${agent.name} 卸载「${pendingUnmount?.name || ''}」吗？Agent 下次同步会收到配置变更。`}
        confirmText="确认卸载"
        danger
        loading={!!unmountingId}
        onCancel={() => {
          if (!unmountingId) {
            setPendingUnmount(null);
          }
        }}
        onConfirm={handleUnmount}
      />
    </>
  );
}
