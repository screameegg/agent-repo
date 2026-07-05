import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, CheckCircle2, Circle, Megaphone, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import Toast, { ToastState } from '../../components/Toast';
import {
  markAllNotificationsReadApi,
  markNotificationReadApi,
  NotificationItem,
  pageNotificationsApi,
} from './service';

const PAGE_SIZE = 10;

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const isFirstUnreadFilterRun = useRef(true);

  useEffect(() => {
    if (isFirstUnreadFilterRun.current) {
      isFirstUnreadFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [unreadOnly]);

  useEffect(() => {
    void loadNotifications(page);
  }, [page, unreadOnly]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadNotifications = async (current = page) => {
    setLoading(true);
    try {
      const response = await pageNotificationsApi({ current, size: PAGE_SIZE, unreadOnly });
      if (response.code === 200) {
        setNotifications(response.data.records);
        setTotal(response.data.total);
        setPage(Number(response.data.current || current));
      } else {
        setToast({ type: 'error', message: response.message || '通知列表加载失败' });
      }
    } catch {
      setToast({ type: 'error', message: '通知列表加载失败' });
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (item: NotificationItem) => {
    if (item.read) return;
    const response = await markNotificationReadApi(item.id);
    if (response.code === 200) {
      setNotifications((items) => items.map((current) => current.id === item.id ? { ...current, read: true } : current));
    } else {
      setToast({ type: 'error', message: response.message || '标记已读失败' });
    }
  };

  const markAllRead = async () => {
    const response = await markAllNotificationsReadApi();
    if (response.code === 200) {
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
      setToast({ type: 'success', message: '全部通知已标记为已读。' });
    } else {
      setToast({ type: 'error', message: response.message || '标记失败' });
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-2 border-[#1A1A1A] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1A1A1A]">
                <Bell className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">通知中心</h2>
            </div>
            <p className="text-sm font-bold text-[#888] mt-2">查看系统公告、技能审核结果和后续同步提醒。</p>
          </div>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3">
            <button
              onClick={() => setUnreadOnly((value) => !value)}
              className={`px-4 py-3 border-2 border-[#1A1A1A] rounded-xl text-sm font-black shadow-[2px_2px_0px_0px_#1A1A1A] ${unreadOnly ? 'bg-[#FFD93D]' : 'bg-white'}`}
            >
              {unreadOnly ? '只看未读' : '查看全部'}
            </button>
            <button onClick={markAllRead} className="inline-flex items-center px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-black shadow-[2px_2px_0px_0px_#1A1A1A]">
              <CheckCheck className="w-4 h-4 mr-2" />
              全部已读
            </button>
            <button onClick={() => void loadNotifications(page)} className="inline-flex items-center px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-black shadow-[2px_2px_0px_0px_#1A1A1A]">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </button>
          </div>
        </div>

        <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[5px_5px_0px_0px_#1A1A1A] overflow-hidden">
          {notifications.map((item) => (
            <button
              key={item.id}
              onClick={() => void markRead(item)}
              className="w-full text-left grid grid-cols-[40px_1fr] sm:grid-cols-[40px_1fr_auto] gap-4 p-4 sm:p-5 border-b-2 border-[#F0F0F0] last:border-b-0 hover:bg-[#FAF9F6] transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-center ${item.read ? 'bg-white' : 'bg-[#FFD93D]'}`}>
                {iconForType(item.notificationType)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#1A1A1A] truncate">{item.title}</h3>
                  {!item.read && <span className="px-2 py-0.5 bg-[#FF6B6B] text-white rounded-full text-[10px] font-black">未读</span>}
                </div>
                <p className="mt-1 text-sm font-bold text-[#555] leading-relaxed">{item.content}</p>
                <p className="mt-2 text-xs font-black text-[#888]">{typeText(item.notificationType)} · {formatTime(item.createdAt)}</p>
              </div>
              <div className="hidden sm:block pt-1">
                {item.read ? <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" /> : <Circle className="w-5 h-5 text-[#FF6B6B]" />}
              </div>
            </button>
          ))}
          {!loading && notifications.length === 0 && (
            <div className="p-10 text-center text-sm font-black text-[#888]">暂无通知。</div>
          )}
          {loading && (
            <div className="p-10 text-center text-sm font-black text-[#888]">通知加载中...</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="px-4 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50">上一页</button>
            <span className="text-sm font-black text-[#1A1A1A]">第 {page} / {totalPages} 页</span>
            <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="px-4 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50">下一页</button>
          </div>
        )}
      </motion.div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function iconForType(type: string) {
  if (type === 'system_announcement') {
    return <Megaphone className="w-5 h-5 text-[#1A1A1A]" />;
  }
  return <Bell className="w-5 h-5 text-[#1A1A1A]" />;
}

function typeText(type: string) {
  return ({ system_announcement: '系统公告', skill_audit: '技能审核', sync_reminder: '同步提醒' } as Record<string, string>)[type] || '系统通知';
}

function formatTime(value: string) {
  if (!value) return '';
  return value.replace('T', ' ').slice(0, 19);
}
