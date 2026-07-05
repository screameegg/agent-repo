import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, X, BookOpen, Globe, Lock, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CustomSelect, { SelectOption } from '../../../components/CustomSelect';
import { createSkillApi, deleteSkillApi, listMySkillsApi, offlineSkillApi, publishSkillApi } from '../../skill/service';
import { buildSkillStarterFiles } from '../../skill/Editor/defaultSkillTemplate';
import { SkillPackage } from '../../skill/Editor/types';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Toast, { ToastState } from '../../../components/Toast';
import { resolveSkillIcon } from '../../../utils/image';

const PAGE_SIZE = 9;

export default function PublishedSkills() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [skillToPublish, setSkillToPublish] = useState<string | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<SkillPackage | null>(null);
  const [skills, setSkills] = useState<SkillPackage[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFork, setIsFork] = useState(false);
  const [selectedFork, setSelectedFork] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    void loadSkills(page);
  }, [page]);

  const loadSkills = async (current = page) => {
    const response = await listMySkillsApi({ current, size: PAGE_SIZE });
    if (response.code === 200) {
      setSkills(response.data.records);
      setTotal(response.data.total);
    } else {
      setToast({ type: 'error', message: response.message || '技能列表加载失败' });
    }
  };

  const togglePublish = async (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;
    if (skill.publishStatus === 'published') {
      const response = await offlineSkillApi(skillId);
      if (response.code === 200) {
        setSkills(skills.map(s => s.id === skillId ? response.data : s));
        setToast({ type: 'success', message: '技能已下架。' });
      } else {
        setToast({ type: 'error', message: response.message || '下架失败' });
      }
    } else {
      setSkillToPublish(skillId);
    }
  };

  const confirmPublish = async () => {
    if (skillToPublish) {
      const response = await publishSkillApi(skillToPublish);
      if (response.code === 200) {
        setSkills(skills.map(s => s.id === skillToPublish ? response.data : s));
        if (response.data.auditStatus === 'pending' || response.data.publishStatus === 'pending') {
          setToast({ type: 'info', message: '检测到需要审核的内容，已提交管理员审核，审核通过后会上架到技能市场。' });
        } else {
          setToast({ type: 'success', message: '技能已发布到市场。' });
        }
      } else {
        setToast({ type: 'error', message: response.message || '发布失败' });
      }
      setSkillToPublish(null);
    }
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;
    setIsDeleting(true);
    try {
      const response = await deleteSkillApi(skillToDelete.id);
      if (response.code !== 200) {
        setToast({ type: 'error', message: response.message || '删除失败' });
        return;
      }
      const nextTotal = Math.max(0, total - 1);
      const maxPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      setToast({ type: 'success', message: '技能已删除。' });
      setSkillToDelete(null);
      if (page > maxPage) {
        setPage(maxPage);
      } else {
        await loadSkills(page);
      }
    } catch {
      setToast({ type: 'error', message: '删除失败' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!newSkillName.trim()) return;
    const response = await createSkillApi({
      id: '',
      name: newSkillName,
      description: newSkillDesc,
      version: '1.0.0',
      visibility: 'private',
      publishStatus: 'draft',
      files: buildSkillStarterFiles(newSkillName, newSkillDesc),
    });
    if (response.code === 200) {
      navigate(`/app/profile/skill-editor/${response.data.id}`, {
        state: { name: newSkillName, desc: newSkillDesc, isFork }
      });
    } else {
      setMessage(response.message || '创建失败');
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#1A1A1A] pb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/app/profile" className="p-2 border-2 border-[#1A1A1A] rounded-lg hover:bg-gray-50 shadow-[2px_2px_0px_0px_#1A1A1A] transition-all">
              <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
            </Link>
            <span className="text-xl font-bold text-[#888]">/</span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] truncate">我创建的技能包</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
             <button 
               onClick={() => setShowGuideModal(true)}
               className="min-h-11 flex items-center justify-center px-3 sm:px-4 py-2.5 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:bg-gray-50 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-xs sm:text-sm"
             >
               <BookOpen className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
               开发指南
             </button>
             <button 
               onClick={() => setShowCreateModal(true)}
               className="min-h-11 flex items-center justify-center px-3 sm:px-5 py-2.5 bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:shadow-[5px_5px_0px_0px_#1A1A1A] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-xs sm:text-sm"
             >
               <Plus className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
               创建新技能
             </button>
          </div>
        </div>
        {message && (
          <div className="bg-[#FFF0F0] border-2 border-[#FF6B6B] rounded-2xl px-4 py-3 text-sm font-black text-[#B42318]">
            {message}
          </div>
        )}

        {skills.length === 0 ? (
          <div className="bg-[#FAF9F6] rounded-3xl border-2 border-[#1A1A1A] p-12 shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col items-center justify-center min-h-[400px]">
             <div className="w-20 h-20 bg-white border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-3xl flex items-center justify-center mb-6 text-[#1A1A1A]">
                <Package className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-black text-[#1A1A1A] mb-2">暂无创建的技能包</h3>
             <p className="text-sm font-bold text-[#888] text-center max-w-sm mb-6">开发并在市场中分享你的能力模块，与社区一起推动智能应用建设。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skills.map((skill) => (
              <div 
                key={skill.id}
                className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all flex flex-col group h-full"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-14 h-14 flex items-center justify-center border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] bg-[#FDFCFB] transition-colors shrink-0">
                     <img src={resolveSkillIcon(skill.icon, skill.name)} alt={skill.name} className="w-8 h-8 object-contain" />
                  </div>
                  {skill.publishStatus === 'published' && (
                     <span className="min-h-6 flex items-center text-[10px] bg-[#E3F2FD] text-[#1565C0] border border-[#90CAF9] px-2 py-0.5 rounded font-bold uppercase tracking-wider text-right leading-tight">
                       <Globe className="w-3 h-3 mr-1 shrink-0" /> 已发布到市场
                     </span>
                  )}
                  {skill.publishStatus !== 'published' && (
                     <span className={`min-h-6 flex items-center text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider text-right leading-tight ${statusClassName(skill)}`}>
                       <Lock className="w-3 h-3 mr-1 shrink-0" /> {skillStatusText(skill)}
                     </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-[#1A1A1A] mb-2">{skill.name}</h3>
                  <p className="text-xs font-bold text-[#888] line-clamp-2 leading-relaxed mb-6">{skill.description}</p>
                  {(skill.auditStatus === 'pending' || skill.auditStatus === 'rejected') && (
                    <div className={`mb-4 px-3 py-2 rounded-xl border-2 text-xs font-black ${skill.auditStatus === 'rejected' ? 'bg-[#FFEDEB] border-[#FF6B6B] text-[#B42318]' : 'bg-[#FFF4E0] border-[#FFCC80] text-[#E65100]'}`}>
                      {skill.auditStatus === 'rejected'
                        ? `审核未通过：${skill.auditReason || '管理员未填写原因'}`
                        : '已提交审核，审核通过后自动进入技能市场。'}
                    </div>
                  )}
                </div>
                <div className="mt-auto pt-4 border-t-2 border-dashed border-[#E0E0E0] grid grid-cols-[1fr_auto] sm:flex gap-3">
                   <button 
                     onClick={() => navigate(`/app/profile/skill-editor/${skill.id}`)}
                     className="min-h-10 flex-1 py-2 flex items-center justify-center rounded-xl bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all text-xs font-black text-[#1A1A1A]"
                   >
                     <Edit className="w-3.5 h-3.5 mr-1 shrink-0" />
                     编辑技能
                   </button>
                   <button 
                     onClick={() => togglePublish(skill.id)}
                     disabled={skill.auditStatus === 'pending'}
                     className={`min-h-10 col-span-2 sm:col-span-1 sm:flex-1 py-2 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all text-xs font-black ${
                       skill.publishStatus === 'published' ? 'bg-[#FFEDEB] text-[#FF6B6B]' : 'bg-[#FFD93D] text-[#1A1A1A] disabled:opacity-60 disabled:cursor-not-allowed'
                     }`}
                   >
                     {skill.publishStatus === 'published' ? '从系统下架' : skill.auditStatus === 'pending' ? '审核中' : '发布到系统'}
                   </button>
                   <button
                     onClick={() => setSkillToDelete(skill)}
                     className="min-h-10 px-3 py-2 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all text-xs font-black bg-white text-[#FF6B6B] hover:bg-[#FFEDEB]"
                     title="删除技能"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
        {showCreateModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#1A1A1A] relative"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
              
              <div className="flex flex-col mt-2">
                <div className="w-14 h-14 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A] mb-6">
                  <Package className="w-7 h-7 text-[#1A1A1A]" />
                </div>
                <h3 className="text-2xl font-black text-[#1A1A1A] mb-6">创建一个新技能</h3>
                
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-black text-[#1A1A1A] mb-2">选择模板或作为复刻起点 (可选)</label>
                    <CustomSelect 
                      value={selectedFork}
                      placeholder="-- 从空白开始 --"
                      options={[
                        { value: 'none', label: '-- 从空白开始 --' },
                        { value: 'GitHub Integration', label: 'GitHub Integration', group: '已安装的技能', data: { name: 'GitHub Integration', description: '访问 Github 代码仓库，读取 Issues 和 PR。' } },
                        { value: 'MySQL Analytics', label: 'MySQL Analytics', group: '已安装的技能', data: { name: 'MySQL Analytics', description: '分析执行 SQL 的性能与结果面板。' } },
                        { value: 'File System Sync', label: 'File System Sync', group: '已安装的技能', data: { name: 'File System Sync', description: '支持本地文件系统的读写操作。' } },
                      ]}
                      onChange={(val, data) => {
                        setSelectedFork(val);
                        if (val !== 'none' && data) {
                          setNewSkillName(`${data.name} (副本)`);
                          setNewSkillDesc(data.description);
                          setIsFork(true);
                        } else {
                          setNewSkillName('');
                          setNewSkillDesc('');
                          setIsFork(false);
                        }
                      }}
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-black text-[#1A1A1A] mb-2">技能名称</label>
                     <input 
                       type="text" 
                       value={newSkillName}
                       onChange={(e) => setNewSkillName(e.target.value)}
                       placeholder="例如：网络抓取大师"
                       className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-[#1A1A1A] font-bold focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] outline-none transition-all" 
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-black text-[#1A1A1A] mb-2">功能描述</label>
                     <textarea 
                       rows={4}
                       value={newSkillDesc}
                       onChange={(e) => setNewSkillDesc(e.target.value)}
                       placeholder="描述该技能包的核心作用..."
                       className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-[#1A1A1A] font-bold focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] outline-none transition-all resize-none custom-scrollbar" 
                     />
                  </div>
                </div>

                <button 
                  onClick={handleCreate}
                  disabled={!newSkillName.trim()}
                  className="w-full py-3 bg-[#1A1A1A] text-white font-black rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#FFD93D] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#FFD93D] transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前往编辑器继续
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showGuideModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowGuideModal(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_#1A1A1A] relative max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
              
              <div className="flex items-center gap-4 mb-6 mt-2">
                <div className="w-12 h-12 bg-[#E3F2FD] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <BookOpen className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <h3 className="text-2xl font-black text-[#1A1A1A]">技能开发指南</h3>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-2xl shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <h4 className="text-lg font-black text-[#1A1A1A] mb-2">1. 什么是技能？</h4>
                  <p className="text-sm font-bold text-[#888] leading-relaxed">
                    技能 (Skill) 是 Agent 的外挂能力模块。通过实现特定接口，你可以为 Agent 提供诸如数据库直连、API 调用、文件读写等拓展能力。
                  </p>
                </div>
                
                <div className="p-4 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-2xl shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <h4 className="text-lg font-black text-[#1A1A1A] mb-2">2. 开发规范</h4>
                  <ul className="text-sm font-bold text-[#888] leading-relaxed list-disc list-inside space-y-1">
                    <li>使用 TypeScript 编写核心逻辑</li>
                    <li>遵循统一的入参和出参数据结构验证</li>
                    <li>必须提供完整的 Markdown 格式使用说明</li>
                    <li>避免依赖平台特定的底层 API</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-2xl shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <h4 className="text-lg font-black text-[#1A1A1A] mb-2">3. 提交流程</h4>
                  <p className="text-sm font-bold text-[#888] leading-relaxed">
                    将开发完成的模块打包成 `.zip` 格式，在发布界面上传。系统会自动进行自动化扫描与测试，测试通过后可正式上架到技能市场。
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {skillToPublish && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSkillToPublish(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-8 max-w-sm w-full shadow-[8px_8px_0px_0px_#1A1A1A] relative text-center"
            >
              <button 
                onClick={() => setSkillToPublish(null)}
                className="absolute top-4 right-4 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
              
              <div className="flex flex-col items-center mt-2">
                <div className="w-16 h-16 bg-[#E3F2FD] border-2 border-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A] mb-6">
                  <Globe className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <h3 className="text-2xl font-black text-[#1A1A1A] mb-4">准备发布到市场？</h3>
                
                <p className="text-sm font-bold text-[#888] mb-8 leading-relaxed">
                  系统会先进行敏感内容检测。检测通过会直接上架；命中敏感词会进入管理员审核，审核通过后才会出现在技能市场。每个用户每天最多申请 5 次。
                </p>

                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setSkillToPublish(null)}
                    className="flex-1 py-3 bg-white text-[#1A1A1A] font-black rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A]"
                  >
                    取消
                  </button>
                  <button 
                    onClick={confirmPublish}
                    className="flex-1 py-3 bg-[#FFD93D] text-[#1A1A1A] font-black rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A]"
                  >
                    确认发布
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!skillToDelete}
        title="删除技能"
        description={`确定要删除「${skillToDelete?.name || ''}」吗？删除后该技能会从你的创建列表移除，已安装关系也会被清理。`}
        confirmText="确认删除"
        danger
        loading={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setSkillToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function skillStatusText(skill: SkillPackage) {
  if (skill.auditStatus === 'pending' || skill.publishStatus === 'pending') {
    return '待审核';
  }
  if (skill.auditStatus === 'rejected') {
    return '审核未通过';
  }
  if (skill.publishStatus === 'offline') {
    return '已下架';
  }
  return '仅个人可见';
}

function statusClassName(skill: SkillPackage) {
  if (skill.auditStatus === 'pending' || skill.publishStatus === 'pending') {
    return 'bg-[#FFF4E0] text-[#E65100] border border-[#FFCC80]';
  }
  if (skill.auditStatus === 'rejected') {
    return 'bg-[#FFEDEB] text-[#B42318] border border-[#FF6B6B]';
  }
  return 'bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]';
}
