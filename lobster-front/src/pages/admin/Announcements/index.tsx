import React, { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { motion } from 'motion/react';
import Toast, { ToastState } from '../../../components/Toast';
import { publishAdminAnnouncementApi } from '../service';

export default function AdminAnnouncements() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      setToast({ type: 'error', message: '公告标题和内容不能为空' });
      return;
    }
    setLoading(true);
    try {
      const response = await publishAdminAnnouncementApi({ title, content });
      if (response.code === 200) {
        setToast({ type: 'success', message: `公告已发布，已送达 ${response.data.deliveredCount} 个用户。` });
        setTitle('');
        setContent('');
      } else {
        setToast({ type: 'error', message: response.message || '公告发布失败' });
      }
    } catch {
      setToast({ type: 'error', message: '公告发布失败' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
        <div className="border-b-2 border-[#1A1A1A] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1A1A1A]">
              <Megaphone className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">公告管理</h2>
          </div>
          <p className="text-sm font-bold text-[#888] mt-2">发布系统公告，所有启用用户会在通知中心收到。</p>
        </div>

        <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[5px_5px_0px_0px_#1A1A1A] p-4 sm:p-6 space-y-5">
          <div>
            <label className="block text-sm font-black text-[#1A1A1A] mb-2">公告标题</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={128}
              className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none"
              placeholder="例如：本周技能市场审核规则更新"
            />
          </div>
          <div>
            <label className="block text-sm font-black text-[#1A1A1A] mb-2">公告内容</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={8}
              maxLength={1024}
              className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none resize-none custom-scrollbar"
              placeholder="写给用户看的公告内容..."
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={loading}
              className="inline-flex w-full sm:w-auto items-center justify-center px-5 py-3 bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-0.5 font-black text-sm disabled:opacity-60"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? '发布中...' : '发布公告'}
            </button>
          </div>
        </div>
      </motion.div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
