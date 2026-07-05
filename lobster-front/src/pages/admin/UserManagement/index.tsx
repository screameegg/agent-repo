import React, { useEffect, useRef, useState } from 'react';
import { Search, UserCog } from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Toast, { ToastState } from '../../../components/Toast';
import { AdminUser, pageAdminUsersApi, updateAdminUserRoleApi, updateAdminUserStatusApi } from '../service';
import { resolveProfileAvatar } from '../../../utils/image';

const PAGE_SIZE = 12;

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [action, setAction] = useState<'admin' | 'user' | 'disable' | 'enable' | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const isFirstKeywordRun = useRef(true);

  useEffect(() => {
    if (isFirstKeywordRun.current) {
      isFirstKeywordRun.current = false;
      return;
    }
    setPage(1);
  }, [keyword]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers(page);
    }, keyword ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [page, keyword]);

  const loadUsers = async (current = page) => {
    const response = await pageAdminUsersApi({
      current,
      size: PAGE_SIZE,
      keyword: keyword || undefined,
    });
    if (response.code === 200) {
      setUsers(response.data.records);
      setTotal(response.data.total);
      setPage(Number(response.data.current || current));
    } else {
      setToast({ type: 'error', message: response.message || '用户列表加载失败' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openAction = (user: AdminUser, nextAction: 'admin' | 'user' | 'disable' | 'enable') => {
    setSelected(user);
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
      const response = action === 'admin'
        ? await updateAdminUserRoleApi(selected.id, 'admin')
        : action === 'user'
          ? await updateAdminUserRoleApi(selected.id, 'user')
          : action === 'disable'
            ? await updateAdminUserStatusApi(selected.id, 'disabled')
            : await updateAdminUserStatusApi(selected.id, 'active');
      if (response.code !== 200) {
        setToast({ type: 'error', message: response.message || '用户操作失败' });
        return;
      }
      setToast({ type: 'success', message: '用户信息已更新。' });
      closeAction();
      await loadUsers(page);
    } catch {
      setToast({ type: 'error', message: '用户操作失败' });
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
              <UserCog className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">用户管理</h2>
              <p className="text-sm font-bold text-[#888] mt-1">查看平台用户、角色和登录信息。</p>
            </div>
          </div>

          <div className="relative max-w-xl">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索用户名、账号或角色"
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A1A] outline-none"
            />
          </div>
        </div>
      </motion.div>

      <div className="mt-6 bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[5px_5px_0px_0px_#1A1A1A] overflow-hidden">
        {users.map((user) => (
          <div key={user.id} className="grid grid-cols-1 xl:grid-cols-[1fr_120px_120px_150px_240px] gap-4 p-4 sm:p-5 border-b-2 border-[#F0F0F0] last:border-b-0 items-center">
            <div className="flex items-center gap-4 min-w-0">
              <img src={resolveProfileAvatar(user.avatar, user.username)} alt={user.username} className="w-12 h-12 rounded-xl border-2 border-[#1A1A1A] bg-[#FAF9F6] object-cover" />
              <div className="min-w-0">
                <h3 className="text-lg font-black text-[#1A1A1A] truncate">{user.username}</h3>
                <p className="text-sm font-bold text-[#888] truncate">{user.account}</p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-xs font-black w-fit">{user.role}</span>
            <span className={`px-3 py-1.5 border-2 border-[#1A1A1A] rounded-xl text-xs font-black w-fit ${user.status === 'disabled' ? 'bg-[#FFEDEB]' : 'bg-[#E8F5E9]'}`}>
              {user.status === 'disabled' ? '已禁用' : '启用中'}
            </span>
            <p className="text-sm font-bold text-[#555]">注册：{user.createdAt || '-'}</p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 xl:justify-end">
              {user.role === 'admin' ? (
                <button onClick={() => openAction(user, 'user')} className="px-3 py-2 bg-white border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A]">设为用户</button>
              ) : (
                <button onClick={() => openAction(user, 'admin')} className="px-3 py-2 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A]">设为管理员</button>
              )}
              {user.status === 'disabled' ? (
                <button onClick={() => openAction(user, 'enable')} className="px-3 py-2 bg-[#E8F5E9] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A]">恢复</button>
              ) : (
                <button onClick={() => openAction(user, 'disable')} className="px-3 py-2 bg-[#FFEDEB] border-2 border-[#1A1A1A] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1A1A1A]">禁用</button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="p-10 text-center text-sm font-black text-[#888]">暂无符合条件的用户。</div>
        )}
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
        description={`确认对「${selected?.username || ''}」执行该操作吗？`}
        confirmText="确认"
        danger={action === 'disable'}
        loading={loading}
        onCancel={closeAction}
        onConfirm={submitAction}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function actionTitle(action: 'admin' | 'user' | 'disable' | 'enable' | null) {
  return ({ admin: '设为管理员', user: '设为普通用户', disable: '禁用用户', enable: '恢复用户' } as Record<string, string>)[action || 'enable'];
}
