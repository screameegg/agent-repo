import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStore } from '../../../../store/userStore';
import { ProfileInfo, updatePasswordApi, updateProfileApi } from '../service';
import ImageUploader from '../../../../components/ImageUploader';
import { profileAvatarFallback } from '../../../../utils/image';
import { ToastState } from '../../../../components/Toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: ProfileInfo | null;
  onSaved?: (profile: ProfileInfo) => void;
  onNotify?: (toast: ToastState) => void;
}

export default function EditProfileModal({ isOpen, onClose, profile, onSaved, onNotify }: EditProfileModalProps) {
  const { user, setUser } = useUserStore();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername(profile?.username || user?.username || '');
      setAvatar(profile?.avatar || user?.avatar || '');
      setBio(profile?.bio || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setIsUploadingAvatar(false);
    }
  }, [profile, user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMessage('');
    
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('新密码与确认密码不匹配');
      return;
    }
    if (newPassword && !currentPassword) {
      setErrorMessage('修改密码需要填写当前密码');
      return;
    }
    
    if (isUploadingAvatar) {
      setErrorMessage('头像正在上传，请稍后保存');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateProfileApi({
        username,
        avatar,
        bio,
      });
      if (response.code !== 200) {
        setErrorMessage(response.message || '保存资料失败');
        return;
      }
      if (newPassword) {
        const passwordResponse = await updatePasswordApi({
          currentPassword,
          newPassword,
          confirmPassword,
        });
        if (passwordResponse.code !== 200) {
          setErrorMessage(passwordResponse.message || '修改密码失败');
          return;
        }
      }
      setUser({
        ...user,
        username: response.data.username,
        avatar: response.data.avatar,
      });
      onSaved?.(response.data);
      onNotify?.({ type: 'success', message: newPassword ? '资料和密码已保存。' : '个人资料已保存。' });
      onClose();
    } catch (error) {
      setErrorMessage('请求失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 w-full max-w-md shadow-[8px_8px_0px_0px_#1A1A1A] relative my-8"
        >
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-[#1A1A1A]" />
          </button>
          
          <div className="mb-5 border-b-2 border-[#1A1A1A] pb-4">
            <h2 className="text-2xl font-black text-[#1A1A1A]">编辑个人资料</h2>
            <p className="text-sm font-bold text-[#888] mt-1">设置您的头像与安全凭证</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <ImageUploader
                value={avatar}
                fallback={profileAvatarFallback(username || user?.username)}
                alt="Avatar Preview"
                helpText=""
                previewClassName="w-20 h-20 rounded-2xl"
                onChange={(url) => setAvatar(url)}
                onUploadingChange={setIsUploadingAvatar}
                onUploadSuccess={() => onNotify?.({ type: 'success', message: '头像上传成功，保存后生效。' })}
                onUploadError={(message) => onNotify?.({ type: 'error', message })}
              />
              <div className="flex-1">
                <label className="block text-sm font-black text-[#1A1A1A] mb-2">用户昵称</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入您的昵称"
                  required
                  className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold placeholder:text-gray-400 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all"
                />
                <p className="text-xs font-bold text-[#888] mt-2">
                  {isUploadingAvatar ? '头像上传中...' : '点击头像可上传，最大5MB'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-[#1A1A1A] mb-2">个人简介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="告诉 Agent 你的使用偏好或平台说明"
                rows={3}
                className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold placeholder:text-gray-400 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all resize-none"
              />
            </div>

            <div className="pt-4 mt-4 border-t-2 border-dashed border-[#E0E0E0]">
              <h3 className="text-base font-black text-[#1A1A1A] mb-3 flex items-center">
                <KeyRound className="w-5 h-5 mr-2" /> 修改密码
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-black text-[#1A1A1A] mb-2">当前密码 (仅修改密码时需要)</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码"
                    className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold placeholder:text-gray-400 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-black text-[#1A1A1A] mb-2">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="输入新密码"
                      className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold placeholder:text-gray-400 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-[#1A1A1A] mb-2">确认新密码</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次确认新密码"
                      className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold placeholder:text-gray-400 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="px-4 py-3 bg-[#FFF0F0] border-2 border-[#FF6B6B] rounded-xl text-sm font-black text-[#B42318]">
                {errorMessage}
              </div>
            )}
            
            <div className="pt-4 border-t-2 border-[#1A1A1A] flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white text-[#1A1A1A] font-black rounded-xl border-2 border-transparent hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploadingAvatar}
                className="px-6 py-3 bg-[#FFD93D] text-[#1A1A1A] font-black rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                保存更改
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
