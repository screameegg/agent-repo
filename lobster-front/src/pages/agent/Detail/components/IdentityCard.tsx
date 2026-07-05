import React, { useState } from 'react';
import { Agent } from '../../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Link as LinkIcon, X } from 'lucide-react';
import { resolveAgentAvatar } from '../../../../utils/image';

const AGENT_MANUAL_URL = '/docs/ai-agent-api.md';

export default function IdentityCard({ agent }: { agent: Agent }) {
  const [showHelp, setShowHelp] = useState(false);

  const handleHelpClick = () => {
    setShowHelp(true);
  };

  const syncMeta = (() => {
    if (!agent.isAssociated || agent.syncStatus === 'unassociated') {
      return { label: '未关联', className: 'bg-[#FFF3E0] border-[#FF9800] text-[#EF6C00]', help: '创建或绑定 Token 后，Agent 才能拉取平台配置。' };
    }
    if (agent.syncStatus === 'pending') {
      return { label: `待同步${agent.pendingConfigEvents ? ` ${agent.pendingConfigEvents}` : ''}`, className: 'bg-[#FFF4E0] border-[#FF9800] text-[#EF6C00]', help: '人类用户或平台配置已变更，等待 Agent 轮询 events、拉取 config、应用后 ack。' };
    }
    if (agent.syncStatus === 'timeout') {
      return { label: `同步超时${agent.pendingConfigEvents ? ` ${agent.pendingConfigEvents}` : ''}`, className: 'bg-[#FFF0F0] border-[#FF6B6B] text-[#B42318]', help: '存在长时间未确认的配置变更，请检查 Agent 是否还在运行。' };
    }
    return { label: '已同步', className: 'bg-[#E8F5E9] border-[#4CAF50] text-[#2E7D32]', help: agent.lastConfigEventAt ? `最近配置事件：${agent.lastConfigEventAt}` : '当前没有待处理配置变更。' };
  })();

  return (
    <>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6 md:gap-8 relative z-10 w-full">
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full bg-[#FFD93D] border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] overflow-hidden flex items-center justify-center p-2">
            <img src={resolveAgentAvatar(agent.avatar, agent.name)} alt={agent.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] break-words">{agent.name}</h1>
              {agent.isAssociated !== undefined && (
                <div 
                  onClick={!agent.isAssociated ? handleHelpClick : undefined}
                  className={`inline-flex items-center justify-center self-center sm:self-start px-3 py-1.5 rounded-lg border-2 text-xs sm:text-sm font-bold cursor-pointer transition-colors shrink-0 ${
                    agent.isAssociated 
                      ? 'bg-[#E8F5E9] border-[#4CAF50] text-[#2E7D32]' 
                      : 'bg-[#FFF3E0] border-[#FF9800] text-[#EF6C00] hover:bg-[#FFE0B2]'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 mr-1.5" />
                  {agent.isAssociated ? '已关联系统' : '未关联系统'}
                </div>
              )}
            </div>
            <div className={`mt-3 inline-flex max-w-full flex-col px-3 py-2 rounded-xl border-2 text-xs font-black ${syncMeta.className}`}>
              <span>同步状态：{syncMeta.label}</span>
              <span className="mt-1 font-bold opacity-80 break-words">{syncMeta.help}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-[#2D2D2D] leading-relaxed max-w-lg mx-auto md:mx-0 break-words">
              {agent.description}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:flex sm:flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
              <Stat label="创建时间" value={agent.createdAt} />
              <Stat label="系统角色" value={agent.role} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-[6px_6px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-gray-100 hover:bg-gray-200 border-2 border-[#1A1A1A] rounded-xl transition-all hover:rotate-90"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
              
              <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] mb-2 pr-12">Agent 同步手册</h2>
              <p className="text-[#555] font-bold mb-6 sm:mb-8 text-sm">
                此 Agent 还没有绑定有效 Agent Token。创建或绑定 Token 后，Agent 可以按手册下载接口说明，自注册、同步 Skill/记忆/目标，并轮询平台配置变更。
              </p>
              
              <div className="space-y-6">
                <div className="p-5 border-2 border-[#1A1A1A] rounded-2xl bg-[#FAFAFA]">
                  <h3 className="text-lg font-black text-[#1A1A1A] mb-2">1. 创建或绑定 Agent Token</h3>
                  <p className="text-sm font-bold text-[#555] mb-4">前往「个人中心」-「访问令牌」生成 Token。完整同步请开启 agentRegister、agentSync、configRead、skillRead、skillWrite、memoryRead、memoryWrite、goalRead、goalWrite 权限；只读拉取只开启读取类权限。</p>
                </div>
                <div className="p-5 border-2 border-[#1A1A1A] rounded-2xl bg-[#FAFAFA]">
                   <h3 className="text-lg font-black text-[#1A1A1A] mb-2">2. 让 Agent 下载同步手册</h3>
                   <p className="text-sm font-bold text-[#555] mb-4">把下面这个地址交给 Agent。Agent 可以读取手册后调用 /api/ai/** 接口完成注册和同步。</p>
                   <code className="block p-3 bg-[#1A1A1A] text-[#FFD93D] rounded-xl text-sm font-mono relative overflow-hidden break-all">
                     {window.location.origin}{AGENT_MANUAL_URL}
                   </code>
                </div>
                <div className="p-5 border-2 border-[#1A1A1A] rounded-2xl bg-[#FFF4E0]">
                   <h3 className="text-lg font-black text-[#1A1A1A] mb-2">3. Agent 主动拉取平台配置</h3>
                     <p className="text-sm font-bold text-[#555]">
                      当前端给「{agent.name}」搭配技能，或用户调整 Agent 身份、记忆、目标后，平台会生成 config_changed 事件。Agent 轮询 events，发现变更后调用 config 拉取最新配置。
                     </p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t-2 border-[#E0E0E0] grid grid-cols-1 sm:flex sm:justify-end gap-3">
                <a
                  href={AGENT_MANUAL_URL}
                  download
                  className="px-6 py-3 bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl font-black hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载手册
                </a>
                <button onClick={() => setShowHelp(false)} className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold hover:shadow-[4px_4px_0px_0px_#888] transition-all">
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F5F5F5] px-4 py-2 border-2 border-[#1A1A1A] rounded-xl flex flex-col items-center md:items-start text-left min-w-0">
      <span className="block text-[10px] text-[#888] font-bold uppercase tracking-widest mb-0.5">{label}</span>
      <span className="block text-sm font-black text-[#1A1A1A] break-words">{value}</span>
    </div>
  );
}
