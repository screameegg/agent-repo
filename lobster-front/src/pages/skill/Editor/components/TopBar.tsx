import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Save, Check, Settings, FileJson } from 'lucide-react';

interface TopBarProps {
  onSave: () => void;
  onTest: () => void;
  onOpenSettings: () => void;
  onOpenImportExport: () => void;
  skillName?: string;
  isDirty?: boolean;
  isSaving?: boolean;
  autoSaveEnabled?: boolean;
  autoSaveCountdown?: number;
  onToggleAutoSave: () => void;
  lastSaved?: Date;
}

export default function TopBar({
  onSave,
  onTest,
  onOpenSettings,
  onOpenImportExport,
  skillName,
  isDirty,
  isSaving,
  autoSaveEnabled,
  autoSaveCountdown,
  onToggleAutoSave,
  lastSaved,
}: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b-2 border-[#1A1A1A] bg-white shrink-0 shadow-[0px_2px_0px_0px_#1A1A1A] relative z-20 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-3 sm:gap-4 min-w-max">
        <button 
          onClick={() => navigate('/app/profile/published-skills')}
          className="p-2 border-2 border-[#1A1A1A] rounded-lg hover:bg-gray-50 shadow-[2px_2px_0px_0px_#1A1A1A] transition-all shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </button>
        <span className="text-xl font-bold text-[#888] shrink-0">/</span>
        <div className="shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] leading-tight max-w-[13rem] sm:max-w-none truncate">{skillName || '技能开发工作室'}</h2>
          <p className="text-xs font-black text-[#888] uppercase tracking-wider">
            {isSaving ? '保存中' : isDirty ? '有未保存修改' : 'Skill Editor'}
          </p>
        </div>
        
        {lastSaved && (
          <div className="ml-4 flex items-center text-xs font-bold text-[#888] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 shrink-0">
             <span className="flex items-center text-[#4CAF50]"><Check className="w-3 h-3 mr-1" />已保存 {lastSaved.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 sm:gap-4 min-w-max">
         <button
           type="button"
           onClick={onToggleAutoSave}
           className="flex items-center justify-between gap-2 w-20 h-10 px-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-gray-50 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-xs shrink-0"
           title={autoSaveEnabled ? `自动保存开启，${autoSaveCountdown || 20}秒后检查保存` : '自动保存关闭'}
         >
           <span className={`relative w-9 h-5 rounded-full border-2 border-[#1A1A1A] transition-colors ${autoSaveEnabled ? 'bg-[#4CAF50]' : 'bg-[#E0E0E0]'}`}>
             <span className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white border border-[#1A1A1A] rounded-full transition-transform ${autoSaveEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
           </span>
           <span className="w-7 text-center leading-none">{autoSaveEnabled ? `${autoSaveCountdown || 20}s` : 'OFF'}</span>
         </button>
         <button 
           onClick={onOpenSettings}
           className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-gray-50 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-sm"
           title="设置"
         >
           <Settings className="w-4 h-4 mr-2" />
           设置
         </button>
         <button 
           onClick={onOpenImportExport}
           className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-gray-50 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-sm"
           title="导入/导出"
         >
           <FileJson className="w-4 h-4 mr-2" />
           导入/导出
         </button>
         <div className="hidden sm:block w-[2px] bg-[#E0E0E0] mx-1"></div>
         <button 
           onClick={onTest}
           className="flex items-center justify-center px-3 sm:px-4 py-2 bg-[#FAF9F6] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:bg-white active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-sm"
         >
           <Play className="w-4 h-4 mr-2" />
           沙箱测试
         </button>
         <button 
           onClick={onSave}
           disabled={isSaving}
           className="flex items-center justify-center px-4 sm:px-5 py-2 bg-[#4CAF50] text-white border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:shadow-[5px_5px_0px_0px_#4CAF50] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-sm"
         >
           <Save className="w-4 h-4 mr-2" />
           {isSaving ? '保存中' : '保存代码'}
         </button>
      </div>
    </div>
  );
}
