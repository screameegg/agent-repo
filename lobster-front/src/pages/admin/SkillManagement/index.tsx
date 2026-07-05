import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, Globe, Plus, Search, ShieldCheck, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Toast, { ToastState } from '../../../components/Toast';
import { SkillPackage } from '../../skill/Editor/types';
import {
  approveAdminSkillApi,
  offlineAdminSkillApi,
  pageAdminSkillsApi,
  publishAdminSkillApi,
  rejectAdminSkillApi,
} from '../service';
import { resolveSkillIcon } from '../../../utils/image';

const PAGE_SIZE = 10;

type Action = 'approve' | 'reject' | 'publish' | 'offline';

export default function AdminSkillManagement() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<SkillPackage[]>([]);
  const [keyword, setKeyword] = useState('');
  const [auditStatus, setAuditStatus] = useState('pending');
  const [publishStatus, setPublishStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<SkillPackage | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const isFirstFilterRun = useRef(true);

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [keyword, auditStatus, publishStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSkills(page);
    }, keyword ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [page, keyword, auditStatus, publishStatus]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadSkills = async (current = page) => {
    const response = await pageAdminSkillsApi({
      current,
      size: PAGE_SIZE,
      keyword: keyword || undefined,
      auditStatus: auditStatus || undefined,
      publishStatus: publishStatus || undefined,
    });
    if (response.code === 200) {
      setSkills(response.data.records);
      setTotal(response.data.total);
      setPage(Number(response.data.current || current));
    } else {
      setToast({ type: 'error', message: response.message || '管理端技能列表加载失败' });
    }
  };

  const openAction = (skill: SkillPackage, nextAction: Action) => {
    setSelected(skill);
    setAction(nextAction);
    setRejectReason('');
  };

  const closeAction = () => {
    if (loading) return;
    setSelected(null);
    setAction(null);
    setRejectReason('');
  };

  const submitAction = async () => {
    if (!selected || !action) return;
    setLoading(true);
    try {
      const response = action === 'approve'
        ? await approveAdminSkillApi(selected.id)
        : action === 'reject'
          ? await rejectAdminSkillApi(selected.id, rejectReason)
          : action === 'publish'
            ? await publishAdminSkillApi(selected.id)
            : await offlineAdminSkillApi(selected.id);
      if (response.code !== 200) {
        setToast({ type: 'error', message: response.message || '操作失败' });
        return;
      }
      setToast({ type: 'success', message: '操作已完成。' });
      closeAction();
      await loadSkills(page);
    } catch {
      setToast({ type: 'error', message: '操作失败' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
        <div className="flex flex-col gap-4 border-b-2 border-[#1A1A1A] pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1A1A1A]">
                  <ShieldCheck className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">技能管理</h2>
              </div>
              <p className="text-sm font-bold text-[#888] mt-2">审核敏感词拦截的发布申请，维护技能市场上下架状态。</p>
            </div>
            <button
              onClick={() => navigate('/app/profile/skill-editor/new_admin')}
              className="inline-flex w-full md:w-auto items-center justify-center px-5 py-3 bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-0.5 font-black text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建技能
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索技能名称、编码或概述"
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A1A] outline-none"
              />
            </div>
            <select value={auditStatus} onChange={(event) => setAuditStatus(event.target.value)} className="px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-black shadow-[2px_2px_0px_0px_#1A1A1A] outline-none">
              <option value="pending">待审核</option>
              <option value="">全部审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="none">无需审核</option>
            </select>
            <select value={publishStatus} onChange={(event) => setPublishStatus(event.target.value)} className="px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-black shadow-[2px_2px_0px_0px_#1A1A1A] outline-none">
              <option value="">全部状态</option>
              <option value="pending">待上架</option>
              <option value="published">已上架</option>
              <option value="offline">已下架</option>
            </select>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[5px_5px_0px_0px_#1A1A1A] overflow-hidden">
        {skills.map((skill) => (
          <div key={skill.id} className="grid grid-cols-1 xl:grid-cols-[1fr_160px_160px_280px] gap-4 p-4 sm:p-5 border-b-2 border-[#F0F0F0] last:border-b-0">
            <div className="flex items-start gap-4 min-w-0">
              <img src={resolveSkillIcon(skill.icon, skill.name)} alt={skill.name} className="w-14 h-14 rounded-xl border-2 border-[#1A1A1A] bg-[#FAF9F6] p-2 object-contain" />
              <div className="min-w-0">
                <h3 className="text-lg font-black text-[#1A1A1A] truncate">{skill.name}</h3>
                <p className="text-xs font-bold text-[#888] mt-1">{skill.author} · v{skill.version}</p>
                <p className="text-sm font-bold text-[#555] mt-2 line-clamp-2">{skill.description || '暂无概述'}</p>
                {skill.auditReason && <p className="text-xs font-black text-[#B42318] mt-2">{skill.auditReason}</p>}
              </div>
            </div>
            <StatusPill label={skill.auditStatus || 'none'} kind="audit" />
            <StatusPill label={skill.publishStatus || 'draft'} kind="publish" />
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center xl:justify-end gap-2">
              <Link to={`/app/market/${skill.id}`} className="px-3 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A] inline-flex items-center">
                <Eye className="w-3.5 h-3.5 mr-1" />
                查看
              </Link>
              {skill.auditStatus === 'pending' && (
                <>
                  <button onClick={() => openAction(skill, 'approve')} className="px-3 py-2 bg-[#E8F5E9] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A] inline-flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    通过
                  </button>
                  <button onClick={() => openAction(skill, 'reject')} className="px-3 py-2 bg-[#FFEDEB] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A] inline-flex items-center">
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    拒绝
                  </button>
                </>
              )}
              {skill.publishStatus === 'published' ? (
                <button onClick={() => openAction(skill, 'offline')} className="px-3 py-2 bg-[#FFEDEB] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A]">下架</button>
              ) : (
                <button onClick={() => openAction(skill, 'publish')} className="px-3 py-2 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A] inline-flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1" />
                  上架
                </button>
              )}
            </div>
          </div>
        ))}
        {skills.length === 0 && (
          <div className="p-10 text-center text-sm font-black text-[#888]">暂无符合条件的技能。</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="px-4 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50">上一页</button>
          <span className="text-sm font-black text-[#1A1A1A]">第 {page} / {totalPages} 页</span>
          <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="px-4 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50">下一页</button>
        </div>
      )}

      {action === 'reject' && selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border-[3px] sm:border-4 border-[#1A1A1A] rounded-2xl sm:rounded-3xl shadow-[5px_5px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] p-5 sm:p-6">
            <h3 className="text-xl font-black text-[#1A1A1A]">拒绝审核</h3>
            <p className="mt-2 text-sm font-bold text-[#555]">填写「{selected.name}」的拒绝原因。</p>
            <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} className="mt-4 w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none resize-none" />
            <div className="mt-5 grid grid-cols-1 sm:flex sm:justify-end gap-3">
              <button onClick={closeAction} disabled={loading} className="px-5 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A]">取消</button>
              <button onClick={submitAction} disabled={loading} className="px-5 py-3 bg-[#FF6B6B] text-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A]">{loading ? '处理中...' : '确认拒绝'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!selected && !!action && action !== 'reject'}
        title={actionTitle(action)}
        description={`确认对「${selected?.name || ''}」执行该操作吗？`}
        confirmText="确认"
        loading={loading}
        danger={action === 'offline'}
        onCancel={closeAction}
        onConfirm={submitAction}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function StatusPill({ label, kind }: { label: string; kind: 'audit' | 'publish' }) {
  const text = kind === 'audit' ? auditText(label) : publishText(label);
  return (
    <div className="flex items-center xl:justify-center">
      <span className="px-3 py-1.5 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-xs font-black">{text}</span>
    </div>
  );
}

function auditText(value: string) {
  return ({ pending: '待审核', approved: '已通过', rejected: '已拒绝', none: '无需审核' } as Record<string, string>)[value] || value;
}

function publishText(value: string) {
  return ({ draft: '草稿', pending: '待上架', published: '已上架', offline: '已下架' } as Record<string, string>)[value] || value;
}

function actionTitle(action: Action | null) {
  return ({ approve: '通过审核', publish: '上架技能', offline: '下架技能', reject: '拒绝审核' } as Record<Action, string>)[action || 'publish'];
}
