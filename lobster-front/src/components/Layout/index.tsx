import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Bell, Bot, LogOut, Package, Store, ArrowRightLeft, UserCircle, ChevronLeft, ChevronRight, ShieldCheck, UserCog, Megaphone, Menu, X } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { cn } from '../../utils/cn';
import { unreadNotificationCountApi } from '../../pages/notifications/service';
import FeedbackWidget from '../feedback/FeedbackWidget';

export default function Layout() {
  const { clearAuth, user, token } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    const loadUnreadCount = async () => {
      try {
        const response = await unreadNotificationCountApi();
        if (response.code === 200) {
          setUnreadCount(Number(response.data.count || 0));
        }
      } catch {
        setUnreadCount(0);
      }
    };
    void loadUnreadCount();
  }, [token]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="flex h-screen w-full bg-[#FAF9F6] text-[#2D2D2D] font-sans selection:bg-[#FFD93D] selection:text-[#1A1A1A] overflow-hidden">
      <aside className={cn("hidden md:flex border-r-2 border-[#1A1A1A] flex-col bg-white transition-all duration-300 relative", collapsed ? "w-20" : "w-56")}>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-8 bg-white border-2 border-[#1A1A1A] rounded-lg p-0.5 shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all z-20 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-[#1A1A1A]" /> : <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />}
        </button>

        <div className={cn("p-6 flex items-center h-24", collapsed ? "justify-center" : "gap-3")}>
          <div className="w-10 h-10 shrink-0 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1A1A1A]">
            <Bot className="w-6 h-6 text-[#1A1A1A]" />
          </div>
          {!collapsed && <span className="text-xl font-black tracking-tight text-[#1A1A1A] leading-none mt-1">知栈</span>}
        </div>
        
        <nav className="flex-1 px-4 space-y-3 mt-4">
          <NavItem to="/app" end icon={<Package className="w-5 h-5 shrink-0" />} label="Agent 仓库" collapsed={collapsed} />
          <NavItem to="/app/market" icon={<Store className="w-5 h-5 shrink-0" />} label="技能市场" collapsed={collapsed} />
          <NavItem to="/app/transfer" icon={<ArrowRightLeft className="w-5 h-5 shrink-0" />} label="资产迁移" collapsed={collapsed} />
          <NavItem to="/app/notifications" icon={<Bell className="w-5 h-5 shrink-0" />} label="通知中心" collapsed={collapsed} badge={unreadCount} />
          <NavItem to="/app/profile" icon={<UserCircle className="w-5 h-5 shrink-0" />} label="个人中心" collapsed={collapsed} />
          {user?.role === 'admin' && (
            <div className="pt-4 mt-4 border-t-2 border-dashed border-[#E0E0E0] space-y-3">
              <NavItem to="/app/admin/skills" icon={<ShieldCheck className="w-5 h-5 shrink-0" />} label="技能管理" collapsed={collapsed} />
              <NavItem to="/app/admin/users" icon={<UserCog className="w-5 h-5 shrink-0" />} label="用户管理" collapsed={collapsed} />
              <NavItem to="/app/admin/announcements" icon={<Megaphone className="w-5 h-5 shrink-0" />} label="公告管理" collapsed={collapsed} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t-2 border-[#1A1A1A] bg-[#FEF9F3]">
          <button 
            onClick={clearAuth}
            className={cn(
              "flex items-center justify-center w-full py-3 text-sm font-black text-[#1A1A1A] rounded-xl hover:-translate-y-0.5 transition-all border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A]",
              collapsed ? "px-0" : "px-4"
            )}
            title="安全退出"
          >
            <LogOut className={cn("w-4 h-4", collapsed ? "" : "mr-2 shrink-0")} />
            {!collapsed && "安全退出"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#FAF9F6] min-w-0">
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b-2 border-[#1A1A1A] bg-white px-4 py-3 shadow-[0px_2px_0px_0px_#1A1A1A]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#1A1A1A]">
              <Bot className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#1A1A1A] leading-none truncate">知栈</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-2 bg-white border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A]"
            aria-label="打开导航菜单"
          >
            <Menu className="w-5 h-5 text-[#1A1A1A]" />
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" onClick={closeMobileNav}>
            <div
              className="absolute right-0 top-0 flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col border-l-2 border-[#1A1A1A] bg-white shadow-[-6px_0px_0px_0px_#1A1A1A]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#1A1A1A]">
                    <Bot className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-[#1A1A1A] leading-none">知栈</span>
                </div>
                <button
                  type="button"
                  onClick={closeMobileNav}
                  className="p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl"
                  aria-label="关闭导航菜单"
                >
                  <X className="w-5 h-5 text-[#1A1A1A]" />
                </button>
              </div>

              <nav className="flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
                <NavItem to="/app" end icon={<Package className="w-5 h-5 shrink-0" />} label="Agent 仓库" collapsed={false} onNavigate={closeMobileNav} />
                <NavItem to="/app/market" icon={<Store className="w-5 h-5 shrink-0" />} label="技能市场" collapsed={false} onNavigate={closeMobileNav} />
                <NavItem to="/app/transfer" icon={<ArrowRightLeft className="w-5 h-5 shrink-0" />} label="资产迁移" collapsed={false} onNavigate={closeMobileNav} />
                <NavItem to="/app/notifications" icon={<Bell className="w-5 h-5 shrink-0" />} label="通知中心" collapsed={false} badge={unreadCount} onNavigate={closeMobileNav} />
                <NavItem to="/app/profile" icon={<UserCircle className="w-5 h-5 shrink-0" />} label="个人中心" collapsed={false} onNavigate={closeMobileNav} />
                {user?.role === 'admin' && (
                  <div className="pt-4 mt-4 border-t-2 border-dashed border-[#E0E0E0] space-y-3">
                    <NavItem to="/app/admin/skills" icon={<ShieldCheck className="w-5 h-5 shrink-0" />} label="技能管理" collapsed={false} onNavigate={closeMobileNav} />
                    <NavItem to="/app/admin/users" icon={<UserCog className="w-5 h-5 shrink-0" />} label="用户管理" collapsed={false} onNavigate={closeMobileNav} />
                    <NavItem to="/app/admin/announcements" icon={<Megaphone className="w-5 h-5 shrink-0" />} label="公告管理" collapsed={false} onNavigate={closeMobileNav} />
                  </div>
                )}
              </nav>

              <div className="border-t-2 border-[#1A1A1A] bg-[#FEF9F3] p-4">
                <button
                  onClick={() => {
                    closeMobileNav();
                    clearAuth();
                  }}
                  className="flex w-full items-center justify-center rounded-xl border-2 border-[#1A1A1A] bg-white px-4 py-3 text-sm font-black text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]"
                >
                  <LogOut className="mr-2 h-4 w-4 shrink-0" />
                  安全退出
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
      <FeedbackWidget />
    </div>
  );
}

function NavItem({ to, icon, label, collapsed, end, badge, onNavigate }: { to: string; icon: React.ReactNode; label: string, collapsed: boolean, end?: boolean, badge?: number, onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      onClick={onNavigate}
      className={({ isActive }) => cn(
        "flex items-center p-3.5 rounded-xl transition-all cursor-pointer font-bold overflow-hidden",
        collapsed ? "justify-center" : "gap-3",
        isActive 
          ? "bg-[#FFEDEB] text-[#FF6B6B] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A]" 
          : "hover:bg-[#F5F5F5] text-[#1A1A1A] border-2 border-transparent"
      )}
    >
      <span className="relative shrink-0">
        {icon}
        {!!badge && (
          <span className="absolute -right-2 -top-2 min-w-4 h-4 px-1 bg-[#FF6B6B] text-white rounded-full text-[10px] leading-4 text-center font-black border border-[#1A1A1A]">
            {badge > 99 ? '99' : badge}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="text-[15px] whitespace-nowrap flex-1">{label}</span>
      )}
    </NavLink>
  );
}
