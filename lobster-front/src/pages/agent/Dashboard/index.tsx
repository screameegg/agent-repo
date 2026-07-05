import React, { useEffect, useState } from 'react';
import { Plus, X, Bot, Wand2, Copy, CheckCircle2, Download, FileText } from 'lucide-react';
import AgentCard from './components/AgentCard';
import { motion, AnimatePresence } from 'motion/react';
import { Agent } from '../types';
import { createAgentApi, deleteAgentApi, pageAgentsApi } from '../service';
import ImageUploader from '../../../components/ImageUploader';
import { agentAvatarFallback } from '../../../utils/image';
import { buildAgentManualUrl, buildAiAgentOnboardingPrompt } from './aiOnboarding';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { removeAgentById } from '../repository';
import { writeClipboardText } from '../../../utils/clipboard';

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDeleteAgent, setPendingDeleteAgent] = useState<Agent | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [copiedAiFlow, setCopiedAiFlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    role: '',
    systemPrompt: '',
    avatar: '',
  });
  const frontendOrigin = typeof window === 'undefined' ? '' : window.location.origin;
  const manualUrl = buildAgentManualUrl(frontendOrigin);
  const aiOnboardingPrompt = buildAiAgentOnboardingPrompt({
    frontendOrigin,
    agentName: form.name,
    role: form.role,
  });

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pageAgentsApi({ current: 1, size: 50 });
      if (res.code === 200) {
        setAgents(res.data.records);
      } else {
        setError(res.message || 'Agent加载失败');
      }
    } catch {
      setError('Agent加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  const handleCopyAiFlow = async () => {
    try {
      await writeClipboardText(aiOnboardingPrompt);
      setCopiedAiFlow(true);
      window.setTimeout(() => setCopiedAiFlow(false), 2000);
    } catch {
      setError('复制失败，请手动复制接入流程');
    }
  };

  const handleCreateAgent = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      setError('请填写Agent名称和角色定位');
      return;
    }
    if (uploadingAvatar) {
      setError('头像正在上传，请稍后创建');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const res = await createAgentApi({
        name: form.name,
        role: form.role,
        description: form.systemPrompt || `${form.name} 的核心职责是 ${form.role}`,
        systemPrompt: form.systemPrompt,
        avatar: form.avatar,
      });
      if (res.code === 200) {
        setAgents([res.data, ...agents]);
        setShowCreateModal(false);
        setForm({ name: '', role: '', systemPrompt: '', avatar: '' });
      } else {
        setError(res.message || 'Agent创建失败');
      }
    } catch {
      setError('Agent创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!pendingDeleteAgent) {
      return;
    }
    try {
      setDeleting(true);
      setError(null);
      const res = await deleteAgentApi(pendingDeleteAgent.id);
      if (res.code === 200) {
        setAgents(removeAgentById(agents, pendingDeleteAgent.id));
        setPendingDeleteAgent(null);
      } else {
        setError(res.message || 'Agent删除失败');
      }
    } catch {
      setError('Agent删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#1A1A1A] pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">Agent 仓库</h2>
            <p className="text-[#888] font-bold text-sm mt-1">管理和查看您的数字员工资产</p>
          </div>
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={() => setShowCreateModal(true)}
            className="flex w-full sm:w-auto items-center justify-center px-5 py-3 bg-[#FF6B6B] text-white border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:shadow-[5px_5px_0px_0px_#1A1A1A] active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black text-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            创建 Agent
          </motion.button>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-8"
        >
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onDelete={setPendingDeleteAgent} />
          ))}
        </motion.div>
        {!loading && agents.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-[#D8D8D8] rounded-2xl bg-white">
            <Bot className="w-10 h-10 mx-auto text-[#B0B0B0] mb-3" />
            <p className="text-sm font-black text-[#888]">暂无Agent，创建一个开始管理。</p>
          </div>
        )}
        {loading && <p className="text-sm font-black text-[#888]">Agent加载中...</p>}
        {error && <p className="text-sm font-black text-[#FF6B6B]">{error}</p>}
      </motion.div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-[3px] sm:border-4 border-[#1A1A1A] rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-[5px_5px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] relative max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
              
              <div className="flex items-center gap-4 mb-6 pr-10">
                <div className="w-12 h-12 bg-[#FFEDEB] border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <Wand2 className="w-6 h-6 text-[#FF6B6B]" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A]">初始化新 Agent</h3>
                  <p className="text-sm font-bold text-[#888] mt-1">配置核心人格与职责</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <ImageUploader
                    value={form.avatar}
                    fallback={agentAvatarFallback(form.name)}
                    alt="Agent Avatar Preview"
                    helpText="点击上传 Agent 头像"
                    previewClassName="w-20 h-20 rounded-2xl"
                    onChange={(url) => setForm({ ...form, avatar: url })}
                    onUploadingChange={setUploadingAvatar}
                  />
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-black text-[#1A1A1A]">Agent 头像</p>
                    <p className="text-xs font-bold text-[#888] mt-2 leading-relaxed">
                      不上传时会按名称自动生成默认头像。
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-[#1A1A1A] mb-2">代号名称</label>
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="例如: CodeReviewer"
                    className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-[#1A1A1A] font-bold focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-black text-[#1A1A1A] mb-2">核心定位 (Role)</label>
                  <select
                    value={form.role}
                    onChange={(event) => setForm({ ...form, role: event.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-[#1A1A1A] font-bold focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all outline-none cursor-pointer"
                  >
                    <option value="">选择一个定位...</option>
                    <option value="研发专家">研发专家</option>
                    <option value="设计评审">设计评审</option>
                    <option value="数据分析师">数据分析师</option>
                    <option value="运维工程师">运维工程师</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-[#1A1A1A] mb-2">初始指令 (System Prompt)</label>
                  <textarea 
                    rows={4}
                    value={form.systemPrompt}
                    onChange={(event) => setForm({ ...form, systemPrompt: event.target.value })}
                    placeholder="描述该 Agent 的核心能力和边界..."
                    className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-[#1A1A1A] font-bold focus:bg-white focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all outline-none resize-none custom-scrollbar"
                  ></textarea>
                </div>

                <div className="p-4 bg-[#F7FBFF] border-2 border-[#1A1A1A] rounded-2xl shadow-[2px_2px_0px_0px_#1A1A1A]">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-white border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-[#1976D2]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#1A1A1A]">AI 接入流程</p>
                        <p className="text-xs font-bold text-[#555] mt-1 leading-relaxed">
                          复制给 AI 后，它会按当前站点地址读取手册、自检 Token、注册或同步 Agent，并轮询平台配置。
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white border-2 border-[#1A1A1A] rounded-xl">
                      <p className="text-[11px] font-black text-[#888] mb-1">手册下载地址</p>
                      <code className="block text-xs font-mono font-bold text-[#1A1A1A] break-all">
                        {manualUrl}
                      </code>
                    </div>
                    <div className="p-3 bg-white border-2 border-dashed border-[#1A1A1A] rounded-xl">
                      <p className="text-[11px] font-black text-[#888] mb-1">预留 Token</p>
                      <p className="text-xs font-bold text-[#555] leading-relaxed">
                        创建或绑定 Agent Token 后，把完整 Token 填入 AI 流程里的 <code className="font-mono">LOBSTER_AGENT_TOKEN</code>。
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleCopyAiFlow}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A1A] text-white border-2 border-[#1A1A1A] rounded-xl font-black text-sm hover:bg-[#2D2D2D] transition-colors"
                      >
                        {copiedAiFlow ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedAiFlow ? '已复制流程' : '复制流程给 AI'}
                      </button>
                      <a
                        href="/docs/ai-agent-api.md"
                        download
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl font-black text-sm hover:shadow-[3px_3px_0px_0px_#1A1A1A] transition-all"
                      >
                        <Download className="w-4 h-4" />
                        下载手册
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {error && <div className="mt-5 p-3 text-xs font-black text-white bg-[#FF6B6B] border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A]">{error}</div>}

              <div className="mt-8">
                <button 
                  onClick={handleCreateAgent}
                  disabled={saving || uploadingAvatar}
                  className="w-full py-4 bg-[#FFD93D] text-[#1A1A1A] text-lg font-black rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A]"
                >
                  {saving ? '创建中...' : '确认实例化'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!pendingDeleteAgent}
        title="删除 Agent"
        description={`确定要删除「${pendingDeleteAgent?.name || ''}」吗？删除后会从 Agent 仓库移除，并解除已绑定的访问令牌。`}
        confirmText="确认删除"
        danger
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setPendingDeleteAgent(null);
          }
        }}
        onConfirm={handleDeleteAgent}
      />
    </>
  );
}
