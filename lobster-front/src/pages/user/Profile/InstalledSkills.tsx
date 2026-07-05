import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Store, Trash2, GitFork, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { forkSkillApi, listInstalledSkillsApi, uninstallSkillApi } from '../../skill/service';
import { SkillPackage } from '../../skill/Editor/types';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Toast, { ToastState } from '../../../components/Toast';
import { resolveSkillIcon } from '../../../utils/image';

const PAGE_SIZE = 6;

export default function InstalledSkills() {
  const navigate = useNavigate();
  const [showForkModal, setShowForkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillPackage | null>(null);
  const [forkError, setForkError] = useState('');
  const [isForking, setIsForking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [installedSkills, setInstalledSkills] = useState<SkillPackage[]>([]);

  useEffect(() => {
    void loadInstalledSkills(page);
  }, [page]);

  const loadInstalledSkills = async (current = page) => {
    const response = await listInstalledSkillsApi({ current, size: PAGE_SIZE });
    if (response.code === 200) {
      setInstalledSkills(response.data.records);
      setTotal(response.data.total);
    } else {
      setToast({ type: 'error', message: response.message || '已安装技能加载失败' });
    }
  };

  const confirmFork = async () => {
    if (!selectedSkill) return;
    setForkError('');
    setIsForking(true);
    try {
      const response = await forkSkillApi(selectedSkill.id);
      if (response.code !== 200) {
        setForkError(response.message || '复刻技能失败');
        return;
      }
      setShowForkModal(false);
      setSelectedSkill(null);
      navigate(`/app/profile/skill-editor/${response.data.id}`);
    } catch {
      setForkError('复刻技能失败');
    } finally {
      setIsForking(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedSkill) return;
    setIsDeleting(true);
    try {
      const response = await uninstallSkillApi(selectedSkill.id);
      if (response.code !== 200) {
        setToast({ type: 'error', message: response.message || '卸载失败' });
        return;
      }
      const nextTotal = Math.max(0, total - 1);
      const maxPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      setToast({ type: 'success', message: '已卸载该技能。' });
      setShowDeleteModal(false);
      setSelectedSkill(null);
      if (page > maxPage) {
        setPage(maxPage);
      } else {
        await loadInstalledSkills(page);
      }
    } catch {
      setToast({ type: 'error', message: '卸载失败' });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-6">
        <div className="flex items-center gap-3">
          <Link to="/app/profile" className="p-2 border-2 border-[#1A1A1A] rounded-lg hover:bg-gray-50 shadow-[2px_2px_0px_0px_#1A1A1A] transition-all">
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </Link>
          <span className="text-xl font-bold text-[#888]">/</span>
          <h2 className="text-2xl font-black text-[#1A1A1A]">已安装技能</h2>
        </div>
        <Link to="/app/market" className="flex items-center justify-center px-5 py-2.5 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:shadow-[5px_5px_0px_0px_#1A1A1A] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-sm">
          <Store className="w-4 h-4 mr-2" />
          浏览市场
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {installedSkills.map((skill, index) => (
          <motion.div 
            key={skill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/app/market/${skill.id}`, { state: { from: '/app/profile/installed-skills' } })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate(`/app/market/${skill.id}`, { state: { from: '/app/profile/installed-skills' } });
              }
            }}
            className="flex flex-col p-6 rounded-3xl border-2 border-[#1A1A1A] bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all group shadow-[4px_4px_0px_0px_#1A1A1A] cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 flex items-center justify-center bg-[#FDFCFB] border-2 border-[#1A1A1A] rounded-2xl text-2xl shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <img src={resolveSkillIcon(skill.icon, skill.name)} alt={skill.name} className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1A1A]">{skill.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-black text-[#888] uppercase tracking-wider bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E0E0E0]">v{skill.version}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(event) => { event.stopPropagation(); setSelectedSkill(skill); setShowForkModal(true); }}
                  className="p-2 border-2 border-[#1A1A1A] rounded-xl bg-white hover:bg-[#FFD93D] hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-[2px_2px_0px_0px_#1A1A1A]"
                  title="作为模板进行二次开发 (Fork)"
                >
                  <GitFork className="w-5 h-5 text-[#1A1A1A]" />
                </button>
                <div 
                  className="p-2 border-2 border-[#1A1A1A] rounded-xl bg-[#4CAF50] text-white flex items-center shadow-[2px_2px_0px_0px_#1A1A1A]"
                  title="已启用"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <button 
                  onClick={(event) => { event.stopPropagation(); setSelectedSkill(skill); setShowDeleteModal(true); }}
                  className="p-2 border-2 border-[#1A1A1A] rounded-xl bg-white hover:bg-[#FF6B6B] hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-[2px_2px_0px_0px_#1A1A1A]"
                  title="卸载技能"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <p className="mt-4 text-sm font-bold text-[#666] leading-relaxed">
              {skill.description}
            </p>
          </motion.div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page <= 1}
            className="px-4 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm font-black text-[#1A1A1A]">第 {page} / {totalPages} 页</span>
          <button
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </motion.div>

    <AnimatePresence>
        {showForkModal && selectedSkill && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowForkModal(false); setSelectedSkill(null); }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-8 max-w-sm w-full shadow-[8px_8px_0px_0px_#1A1A1A] relative text-center"
            >
              <button 
                onClick={() => { setShowForkModal(false); setSelectedSkill(null); }}
                className="absolute top-4 right-4 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
              
              <div className="flex flex-col items-center mt-2">
                <div className="w-16 h-16 bg-[#FFF4E0] border-2 border-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A] mb-6">
                  <GitFork className="w-8 h-8 text-[#FF9800]" />
                </div>
                <h3 className="text-2xl font-black text-[#1A1A1A] mb-4">复刻技能</h3>
                
                <p className="text-sm font-bold text-[#888] mb-8 leading-relaxed">
                  你要基于 "{selectedSkill.name}" 创建一个新技能吗？这将在你的工作区创建一个独立副本。
                </p>
                {forkError && (
                  <p className="text-sm font-black text-[#FF5F56] mb-4">{forkError}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button 
                    onClick={() => { setShowForkModal(false); setSelectedSkill(null); }}
                    className="flex-1 py-3 bg-white text-[#1A1A1A] font-black rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A]"
                  >
                    取消
                  </button>
                  <button 
                    onClick={confirmFork}
                    disabled={isForking}
                    className="flex-1 py-3 bg-[#FFD93D] text-[#1A1A1A] font-black rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A]"
                  >
                    {isForking ? '复刻中' : '确认复刻'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

    </AnimatePresence>
    <ConfirmDialog
      open={showDeleteModal && !!selectedSkill}
      title="卸载技能"
      description={`确定要卸载「${selectedSkill?.name || ''}」吗？已挂载到 Agent 的配置需要另外在 Agent 详情中卸载。`}
      confirmText="确认卸载"
      danger
      loading={isDeleting}
      onCancel={() => {
        if (!isDeleting) {
          setShowDeleteModal(false);
          setSelectedSkill(null);
        }
      }}
      onConfirm={confirmDelete}
    />
    <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
