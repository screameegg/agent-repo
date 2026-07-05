import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, Send, X } from 'lucide-react';
import Toast, { ToastState } from '../Toast';
import { useUserStore } from '../../store/userStore';
import { getNpsStatusApi, submitFeedbackApi } from '../../services/feedback';
import { markNpsDismissed, readNpsDismissed, shouldShowNpsPrompt } from './feedbackPrompt';

const categories = [
  { value: 'feature', label: '功能建议' },
  { value: 'bug', label: '问题反馈' },
  { value: 'experience', label: '体验问题' },
  { value: 'other', label: '其他' },
];

const scoreOptions = Array.from({ length: 11 }, (_, index) => index);

export default function FeedbackWidget() {
  const user = useUserStore((state) => state.user);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [npsOpen, setNpsOpen] = useState(false);
  const [category, setCategory] = useState(categories[0].value);
  const [content, setContent] = useState('');
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsContent, setNpsContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const pageUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.pathname}${window.location.search}`;
  }, [feedbackOpen, npsOpen]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    let active = true;
    const dismissed = readNpsDismissed(user.id);
    getNpsStatusApi()
      .then((response) => {
        if (!active || response.code !== 200) {
          return;
        }
        if (shouldShowNpsPrompt({ submitted: Boolean(response.data.submitted), dismissed })) {
          setNpsOpen(true);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user?.id]);

  const closeNps = () => {
    markNpsDismissed(user?.id);
    setNpsOpen(false);
  };

  const submitNps = async () => {
    if (npsScore === null) {
      setToast({ type: 'error', message: '请选择一个推荐分。' });
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitFeedbackApi({
        feedbackType: 'nps',
        score: npsScore,
        category: npsScore >= 9 ? 'promoter' : npsScore >= 7 ? 'passive' : 'detractor',
        content: npsContent,
        pageUrl,
      });
      if (response.code === 200) {
        markNpsDismissed(user?.id);
        setNpsOpen(false);
        setToast({ type: 'success', message: '感谢反馈，已收到你的推荐度评分。' });
      } else {
        setToast({ type: 'error', message: response.message || '提交失败' });
      }
    } catch {
      setToast({ type: 'error', message: '提交失败，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitGeneralFeedback = async () => {
    if (!content.trim()) {
      setToast({ type: 'error', message: '请填写反馈内容。' });
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitFeedbackApi({
        feedbackType: 'general',
        category,
        content,
        pageUrl,
      });
      if (response.code === 200) {
        setFeedbackOpen(false);
        setContent('');
        setCategory(categories[0].value);
        setToast({ type: 'success', message: '反馈已提交，我们会认真查看。' });
      } else {
        setToast({ type: 'error', message: response.message || '反馈提交失败' });
      }
    } catch {
      setToast({ type: 'error', message: '反馈提交失败，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setFeedbackOpen(true)}
        className="fixed right-4 bottom-6 z-40 inline-flex items-center gap-2 rounded-l-2xl rounded-r-md border-2 border-[#1A1A1A] bg-[#FFD93D] px-3 py-3 text-sm font-black text-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]"
        aria-label="提交反馈"
      >
        <MessageSquare className="h-5 w-5 shrink-0" />
        <span className="hidden sm:inline">反馈</span>
      </button>

      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setFeedbackOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border-4 border-[#1A1A1A] bg-white p-5 shadow-[8px_8px_0px_0px_#1A1A1A]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-[#1A1A1A] pb-3">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A]">提交反馈</h2>
                <p className="mt-1 text-xs font-bold text-[#777]">问题、建议或体验卡点都可以直接告诉我们。</p>
              </div>
              <button type="button" onClick={() => setFeedbackOpen(false)} className="rounded-xl border-2 border-[#1A1A1A] bg-[#FAF9F6] p-2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1A1A1A]">反馈类型</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {categories.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCategory(item.value)}
                      className={`rounded-xl border-2 border-[#1A1A1A] px-3 py-2 text-xs font-black ${category === item.value ? 'bg-[#FFD93D] shadow-[2px_2px_0px_0px_#1A1A1A]' : 'bg-white'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1A1A1A]">反馈内容</label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={6}
                  maxLength={2048}
                  className="w-full resize-none rounded-xl border-2 border-[#1A1A1A] bg-[#FAF9F6] px-4 py-3 text-sm font-bold outline-none"
                  placeholder="请描述你遇到的问题、期待的能力或建议..."
                />
                <p className="mt-1 text-right text-xs font-bold text-[#888]">{content.length}/2048</p>
              </div>

              <button
                type="button"
                onClick={submitGeneralFeedback}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 py-3 text-sm font-black text-white shadow-[3px_3px_0px_0px_#FFD93D] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                提交反馈
              </button>
            </div>
          </div>
        </div>
      )}

      {npsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={closeNps}>
          <div className="w-full max-w-xl rounded-2xl border-4 border-[#1A1A1A] bg-white p-5 shadow-[8px_8px_0px_0px_#1A1A1A]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-[#1A1A1A] pb-3">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A]">给知栈打个分</h2>
                <p className="mt-1 text-xs font-bold text-[#777]">你愿意把知栈推荐给朋友或同事吗？</p>
              </div>
              <button type="button" onClick={closeNps} className="rounded-xl border-2 border-[#1A1A1A] bg-[#FAF9F6] p-2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
              {scoreOptions.map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setNpsScore(score)}
                  className={`aspect-square rounded-xl border-2 border-[#1A1A1A] text-sm font-black ${npsScore === score ? 'bg-[#FFD93D] shadow-[2px_2px_0px_0px_#1A1A1A]' : 'bg-white'}`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs font-black text-[#777]">
              <span>完全不愿意</span>
              <span>非常愿意</span>
            </div>

            <textarea
              value={npsContent}
              onChange={(event) => setNpsContent(event.target.value)}
              rows={4}
              maxLength={2048}
              className="mt-4 w-full resize-none rounded-xl border-2 border-[#1A1A1A] bg-[#FAF9F6] px-4 py-3 text-sm font-bold outline-none"
              placeholder="可选：是什么原因影响了你的评分？"
            />

            <button
              type="button"
              onClick={submitNps}
              disabled={submitting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1A1A1A] bg-[#FFD93D] px-5 py-3 text-sm font-black text-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              提交评分
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
