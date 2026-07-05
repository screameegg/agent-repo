import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../../store/userStore';
import { Package, Key, Settings, CheckCircle2, ArrowRight, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import EditProfileModal from './components/EditProfileModal';
import { getProfileApi, ProfileInfo } from './service';
import Toast, { ToastState } from '../../../components/Toast';

export default function Profile() {
  const { user, setUser } = useUserStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const profileResponse = await getProfileApi();
      if (profileResponse.code === 200) {
        setProfile(profileResponse.data);
        if (user) {
          setUser({
            ...user,
            username: profileResponse.data.username,
            avatar: profileResponse.data.avatar,
          });
        }
      }
    };
    loadProfile();
  }, []);

  const displayProfile = profile || {
    username: user?.username || '知栈 User',
    avatar: user?.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=lobster',
    bio: '',
    createdAt: '',
    theme: 'system',
    notifyEnabled: true,
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="border-b-2 border-[#1A1A1A] pb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">个人中心</h2>
        <p className="text-[#888] font-bold text-sm mt-1">账户设置与接入管理</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-8">
        
        {/* User Profile & Settings */}
        <div className="col-span-1 flex flex-col gap-5 sm:gap-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] relative">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-[#FFD93D] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all"
              title="编辑资料"
            >
              <Edit3 className="w-5 h-5 text-[#1A1A1A]" />
            </button>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-3xl bg-[#FFEDEB] border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center justify-center overflow-hidden mb-4">
                <img 
                  src={displayProfile.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=lobster`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] tracking-tight text-center break-all">{displayProfile.username}</h3>
              <p className="text-[#666] font-bold text-sm mt-3 text-center leading-relaxed">{displayProfile.bio || '还没有填写个人简介。'}</p>
              <p className="text-[#888] font-bold text-xs mt-3 uppercase tracking-widest bg-[#F5F5F5] inline-block px-3 py-1 rounded border-2 border-[#1A1A1A]">
                注册于 {displayProfile.createdAt || '未知'}
              </p>
            </div>
          </div>

          <div className="bg-[#FAF9F6] rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-6 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A]">
            <h3 className="text-lg font-black text-[#1A1A1A] mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-[#1A1A1A]" />
              偏好设置
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#2D2D2D]">主题色风格</span>
                <span className="text-xs font-black bg-[#FFD93D] px-2 py-1 border-2 border-[#1A1A1A] rounded-lg">{displayProfile.theme || 'system'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#2D2D2D]">通知推送</span>
                <input type="checkbox" className="w-4 h-4 accent-[#FF6B6B]" checked={displayProfile.notifyEnabled} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Tokens & Skills */}
        <div className="col-span-1 xl:col-span-2 flex flex-col gap-5 sm:gap-8">
          
            <Link to="/app/profile/tokens" className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col justify-between group hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-[#FFF4E0] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] rounded-2xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-[#FF9800]" />
                </div>
                <ArrowRight className="w-6 h-6 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1A1A1A]">访问令牌 (API Keys)</h3>
                <p className="text-sm font-bold text-[#888] mt-2">管理用于外部系统调用或集成 Agent 的安全凭证及权限。</p>
              </div>
            </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
            <Link to="/app/profile/published-skills" className="bg-[#FAF9F6] rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col justify-between group hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <ArrowRight className="w-6 h-6 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1A1A1A]">我创建的技能</h3>
                <p className="text-sm font-bold text-[#888] mt-2">管理自己开发并创建的 Agent 扩展能力模块，支持发布上架到市场。</p>
              </div>
            </Link>

            <Link to="/app/profile/installed-skills" className="bg-[#FAF9F6] rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col justify-between group hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-[#FFEDEB] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-[#FF6B6B]" />
                </div>
                <ArrowRight className="w-6 h-6 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1A1A1A]">已安装技能</h3>
                <p className="text-sm font-bold text-[#888] mt-2">查看并配置当前账户已经订阅和安装的能力包。点击查看详情。</p>
              </div>
            </Link>
          </div>
          
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSaved={setProfile}
        onNotify={setToast}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </motion.div>
  );
}
