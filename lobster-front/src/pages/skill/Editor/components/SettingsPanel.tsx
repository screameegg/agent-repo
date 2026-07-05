import React, { useEffect, useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { SkillConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ImageUploader from '../../../../components/ImageUploader';
import { skillIconFallback } from '../../../../utils/image';

interface SettingsPanelProps {
  config: SkillConfig;
  onChange: (config: SkillConfig) => void;
  onSave: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ config, onChange, onSave, isOpen, onClose }: SettingsPanelProps) {
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [runtimeText, setRuntimeText] = useState('');
  const [capabilitiesText, setCapabilitiesText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setRuntimeText((config.runtimeEnvironments || []).join('\n'));
    setCapabilitiesText((config.coreCapabilities || []).join('\n'));
  }, [isOpen]);

  const toList = (value: string) => value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  const updateList = (field: 'runtimeEnvironments' | 'coreCapabilities', value: string) => {
    onChange({
      ...config,
      [field]: toList(value),
    });
  };

  const handleSave = () => {
    if (isUploadingIcon) {
      return;
    }
    onSave();
    onClose();
  };

  return (
    <AnimatePresence>
    {isOpen && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-8 max-w-xl w-full shadow-[8px_8px_0px_0px_#1A1A1A] relative max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
          >
            <X className="w-5 h-5 text-[#1A1A1A]" />
          </button>

          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-[#FFD93D] border-2 border-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A]">
                <Settings className="w-6 h-6 text-[#1A1A1A]" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-[#1A1A1A]">技能设置</h2>
               <p className="text-sm font-bold text-[#888]">修改该技能的基础元数据</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
                <ImageUploader
                  value={config.icon}
                  fallback={skillIconFallback(config.name)}
                  alt="Skill Icon Preview"
                  fit="contain"
                  helpText="点击上传技能图标"
                  previewClassName="w-20 h-20 rounded-2xl"
                  onChange={(url) => onChange({ ...config, icon: url })}
                  onUploadingChange={setIsUploadingIcon}
                />
                <div className="flex-1 pt-1">
                  <p className="text-sm font-black text-[#1A1A1A]">技能图标</p>
                  <p className="text-xs font-bold text-[#888] mt-2 leading-relaxed">
                    不上传时会按技能名称自动生成默认图标。
                  </p>
                </div>
            </div>
            <div>
                <label className="block text-sm font-black text-[#1A1A1A] mb-2">技能名称</label>
                <input 
                  type="text" 
                  value={config.name}
                  onChange={(e) => onChange({ ...config, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-base font-bold text-[#1A1A1A] focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] outline-none transition-all" 
                />
            </div>
            <div>
                <label className="block text-sm font-black text-[#1A1A1A] mb-2">技能概述</label>
                <textarea 
                  rows={4}
                  value={config.description}
                  onChange={(e) => onChange({ ...config, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-base font-bold text-[#1A1A1A] focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] outline-none transition-all resize-none custom-scrollbar" 
                />
            </div>
            <div>
                <label className="block text-sm font-black text-[#1A1A1A] mb-2">运行环境限制</label>
                <textarea
                  rows={3}
                  value={runtimeText}
                  onChange={(e) => {
                    setRuntimeText(e.target.value);
                    updateList('runtimeEnvironments', e.target.value);
                  }}
                  placeholder="Node.js 20&#10;Python 3.11&#10;Docker"
                  className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-base font-bold text-[#1A1A1A] focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] outline-none transition-all resize-none custom-scrollbar"
                />
            </div>
            <div>
                <label className="block text-sm font-black text-[#1A1A1A] mb-2">核心能力</label>
                <textarea
                  rows={4}
                  value={capabilitiesText}
                  onChange={(e) => {
                    setCapabilitiesText(e.target.value);
                    updateList('coreCapabilities', e.target.value);
                  }}
                  placeholder="读取并整理项目结构&#10;生成可复用操作步骤&#10;同步 Agent 配置"
                  className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-base font-bold text-[#1A1A1A] focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] outline-none transition-all resize-none custom-scrollbar"
                />
            </div>
            
          </div>

          <button 
            onClick={handleSave}
            disabled={isUploadingIcon}
            className="mt-8 w-full py-3 bg-[#1A1A1A] text-white font-black rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#FFD93D] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#FFD93D] transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存设置
          </button>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
}
