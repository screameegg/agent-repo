import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ClipboardList, MessageSquareText, Search, Star, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Toast, { ToastState } from '../../../components/Toast';
import {
  AdminFeedback,
  AdminFeedbackSummary,
  adminFeedbackSummaryApi,
  pageAdminFeedbackApi,
  updateAdminFeedbackStatusApi,
} from '../service';
import { feedbackStatusText, feedbackTypeText, npsSegment } from './feedbackPresentation';

const PAGE_SIZE = 10;

type FeedbackAction = 'reviewed' | 'closed' | 'open';

const EMPTY_SUMMARY: AdminFeedbackSummary = {
  totalCount: 0,
  generalCount: 0,
  npsCount: 0,
  averageScore: 0,
  promoterCount: 0,
  passiveCount: 0,
  detractorCount: 0,
  openCount: 0,
};

export default function AdminFeedbackManagement() {
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [summary, setSummary] = useState<AdminFeedbackSummary>(EMPTY_SUMMARY);
  const [keyword, setKeyword] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AdminFeedback | null>(null);
  const [action, setAction] = useState<FeedbackAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const isFirstFilterRun = useRef(true);

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [keyword, feedbackType, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFeedback(page);
    }, keyword ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [page, keyword, feedbackType, status]);

  useEffect(() => {
    void loadSummary();
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadSummary = async () => {
    try {
      const response = await adminFeedbackSummaryApi();
      if (response.code === 200) {
        setSummary(response.data);
      }
    } catch {
      setSummary(EMPTY_SUMMARY);
    }
  };

  const loadFeedback = async (current = page) => {
    try {
      const response = await pageAdminFeedbackApi({
        current,
        size: PAGE_SIZE,
        keyword: keyword || undefined,
        feedbackType: feedbackType || undefined,
        status: status || undefined,
      });
      if (response.code === 200) {
        setFeedback(response.data.records);
        setTotal(response.data.total);
        setPage(Number(response.data.current || current));
      } else {
        setToast({ type: 'error', message: response.message || '反馈列表加载失败' });
      }
    } catch {
      setToast({ type: 'error', message: '反馈列表加载失败' });
    }
  };

  const openAction = (item: AdminFeedback, nextAction: FeedbackAction) => {
    setSelected(item);
    setAction(nextAction);
  };

  const closeAction = () => {
    if (loading) return;
    setSelected(null);
    setAction(null);
  };

  const submitAction = async () => {
    if (!selected || !action) return;
    setLoading(true);
    try {
      const response = await updateAdminFeedbackStatusApi(selected.id, action);
      if (response.code !== 200) {
        setToast({ type: 'error', message: response.message || '反馈状态更新失败' });
        return;
      }
      setToast({ type: 'success', message: '反馈状态已更新。' });
      closeAction();
      await Promise.all([loadFeedback(page), loadSummary()]);
    } catch {
      setToast({ type: 'error', message: '反馈状态更新失败' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
        <div className="flex flex-col gap-4 border-b-2 border-[#1A1A1A] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1A1A1A]">
              <MessageSquareText className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">反馈观察</h2>
              <p className="text-sm font-bold text-[#888] mt-1">查看用户反馈、NPS评分和处理状态。</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="总反馈" value={summary.totalCount} icon={<ClipboardList className="w-5 h-5" />} />
            <MetricCard label="待处理" value={summary.openCount} icon={<MessageSquareText className="w-5 h-5" />} tone="warm" />
            <MetricCard label="NPS均分" value={summary.averageScore.toFixed(1)} icon={<Star className="w-5 h-5" />} tone="yellow" />
            <MetricCard label="推荐者" value={summary.promoterCount} icon={<CheckCircle2 className="w-5 h-5" />} tone="green" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_170px] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索反馈内容、分类或页面"
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A1A] outline-none"
              />
            </div>
            <select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value)} className="px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-black shadow-[2px_2px_0px_0px_#1A1A1A] outline-none">
              <option value="">全部类型</option>
              <option value="general">反馈</option>
              <option value="nps">NPS</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-black shadow-[2px_2px_0px_0px_#1A1A1A] outline-none">
              <option value="">全部状态</option>
              <option value="open">待处理</option>
              <option value="reviewed">已查看</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[5px_5px_0px_0px_#1A1A1A] overflow-hidden">
        {feedback.map((item) => (
          <div key={item.id} className="grid grid-cols-1 xl:grid-cols-[1fr_150px_130px_230px] gap-4 p-4 sm:p-5 border-b-2 border-[#F0F0F0] last:border-b-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-xs font-black">{feedbackTypeText(item.feedbackType)}</span>
                <span className={statusClassName(item.status)}>{feedbackStatusText(item.status)}</span>
                {item.score != null && <span className="px-3 py-1.5 bg-[#FFF8D6] border-2 border-[#1A1A1A] rounded-xl text-xs font-black">{item.score} 分 · {npsSegment(item.score)}</span>}
              </div>
              <h3 className="mt-3 text-base sm:text-lg font-black text-[#1A1A1A] break-words">{item.content || '用户未填写详细内容'}</h3>
              <p className="mt-2 text-xs font-bold text-[#888] break-all">{item.pageUrl || '-'} · {item.createdAt || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-black text-[#888]">用户</p>
              <p className="mt-1 text-sm font-black text-[#1A1A1A] break-words">{item.username || '未知用户'}</p>
              <p className="mt-1 text-xs font-bold text-[#888] break-all">{item.account || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-black text-[#888]">分类</p>
              <p className="mt-1 text-sm font-black text-[#1A1A1A] break-words">{item.category || '-'}</p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap xl:justify-end gap-2">
              {item.status !== 'reviewed' && (
                <button onClick={() => openAction(item, 'reviewed')} className="px-3 py-2 bg-[#E8F5E9] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A] inline-flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  已查看
                </button>
              )}
              {item.status !== 'closed' && (
                <button onClick={() => openAction(item, 'closed')} className="px-3 py-2 bg-[#FFEDEB] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A] inline-flex items-center justify-center">
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  关闭
                </button>
              )}
              {item.status !== 'open' && (
                <button onClick={() => openAction(item, 'open')} className="px-3 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A]">重开</button>
              )}
            </div>
          </div>
        ))}
        {feedback.length === 0 && (
          <div className="p-10 text-center text-sm font-black text-[#888]">暂无符合条件的反馈。</div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <NpsBucket label="推荐者" value={summary.promoterCount} />
        <NpsBucket label="中立者" value={summary.passiveCount} />
        <NpsBucket label="批评者" value={summary.detractorCount} />
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="px-4 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50">上一页</button>
          <span className="text-sm font-black text-[#1A1A1A]">第 {page} / {totalPages} 页</span>
          <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="px-4 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50">下一页</button>
        </div>
      )}

      <ConfirmDialog
        open={!!selected && !!action}
        title={actionTitle(action)}
        description={`确认将这条反馈标记为「${feedbackStatusText(action || '')}」吗？`}
        confirmText="确认"
        loading={loading}
        danger={action === 'closed'}
        onCancel={closeAction}
        onConfirm={submitAction}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function MetricCard({ label, value, icon, tone }: { label: string; value: React.ReactNode; icon: React.ReactNode; tone?: 'warm' | 'yellow' | 'green' }) {
  const bg = tone === 'warm' ? 'bg-[#FFEDEB]' : tone === 'green' ? 'bg-[#E8F5E9]' : tone === 'yellow' ? 'bg-[#FFF8D6]' : 'bg-white';
  return (
    <div className={`${bg} border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[2px_2px_0px_0px_#1A1A1A] min-w-0`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-[#888]">{label}</span>
        <span className="shrink-0 text-[#1A1A1A]">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-[#1A1A1A] truncate">{value}</p>
    </div>
  );
}

function NpsBucket({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_#1A1A1A]">
      <p className="text-xs font-black text-[#888]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function statusClassName(status: string) {
  const base = 'px-3 py-1.5 border-2 border-[#1A1A1A] rounded-xl text-xs font-black';
  if (status === 'closed') return `${base} bg-[#FFEDEB]`;
  if (status === 'reviewed') return `${base} bg-[#E8F5E9]`;
  return `${base} bg-[#FFF8D6]`;
}

function actionTitle(action: FeedbackAction | null) {
  return ({ reviewed: '标记已查看', closed: '关闭反馈', open: '重新打开反馈' } as Record<FeedbackAction, string>)[action || 'reviewed'];
}
