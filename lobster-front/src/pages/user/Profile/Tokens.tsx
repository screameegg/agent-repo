import React, { useEffect, useState } from 'react';
import { Key, Plus, Copy, CheckCircle2, Terminal, Shield, ArrowLeft, Trash2, Edit3, Save, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { createAgentTokenApi, deleteAgentTokenApi, listAgentTokensApi, pageAgentsApi, updateAgentTokenApi } from '../../agent/service';
import { Agent, AgentToken } from '../../agent/types';
import { copyableTokenKey, writeClipboardText } from './tokenClipboard';
import {
  TokenPermissionKey,
  TokenPermissions,
  defaultFullSyncPermissions,
  defaultReadOnlyPullPermissions,
  permissionsFromToken,
} from './tokenPermissions';

const permissionOptions = [
  { key: 'skillRead', label: '读取技能', description: '允许拉取 Agent 技能与已挂载 Skill 文件。' },
  { key: 'skillWrite', label: '写入技能', description: '允许上传或更新 Skill。' },
  { key: 'memoryRead', label: '读取记忆', description: '允许拉取 Agent 记忆。' },
  { key: 'memoryWrite', label: '写入记忆', description: '允许同步写入 Agent 记忆。' },
  { key: 'goalRead', label: '读取目标', description: '允许拉取 Agent 目标。' },
  { key: 'goalWrite', label: '写入目标', description: '允许同步写入和删除 Agent 目标。' },
  { key: 'agentRegister', label: '自注册', description: '允许智能体用该令牌注册自身。' },
  { key: 'agentSync', label: '自同步', description: '允许智能体上传角色、技能、记忆和目标。' },
  { key: 'configRead', label: '读取配置', description: '允许智能体拉取平台搭配好的配置。' },
  { key: 'backupExport', label: '导出备份', description: '允许导出完整智能体备份用于迁移或克隆。' },
] as const;

export default function Tokens() {
  const [tokens, setTokens] = useState<AgentToken[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [plainTokenKeys, setPlainTokenKeys] = useState<Record<string, string>>({});
  
  const [selectedToken, setSelectedToken] = useState<AgentToken | null>(null);
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [editTokenName, setEditTokenName] = useState('');
  const [editAgentId, setEditAgentId] = useState('');
  const [editTokenPermissions, setEditTokenPermissions] = useState<TokenPermissions>(defaultReadOnlyPullPermissions);
  const [isCreating, setIsCreating] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newAgentId, setNewAgentId] = useState('');
  const [newTokenPermissions, setNewTokenPermissions] = useState<TokenPermissions>(defaultFullSyncPermissions);
  const [error, setError] = useState<string | null>(null);
  
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadTokens = async () => {
    try {
      setError(null);
      const res = await listAgentTokensApi();
      if (res.code === 200) {
        setTokens(res.data);
      } else {
        setError(res.message || '令牌加载失败');
      }
    } catch {
      setError('令牌加载失败');
    }
  };

  useEffect(() => {
    void loadTokens();
    void pageAgentsApi({ current: 1, size: 100 }).then((res) => {
      if (res.code === 200) {
        setAgents(res.data.records);
      }
    }).catch(() => undefined);
  }, []);

  const agentNameFor = (agentId?: string) => {
    if (!agentId) return '全局令牌';
    return agents.find((agent) => agent.id === agentId)?.name || `Agent ${agentId}`;
  };

  const tokenPayload = (name: string, agentId: string, permissions: TokenPermissions) => ({
    agentId: agentId || undefined,
    name,
    ...permissions,
  });

  const handleCreate = async () => {
    if (!newTokenName.trim()) return;
    try {
      setError(null);
      const res = await createAgentTokenApi(tokenPayload(newTokenName, newAgentId, newTokenPermissions));
      if (res.code === 200) {
        const createdToken = { ...res.data.token, key: res.data.plainToken };
        setPlainTokenKeys({ ...plainTokenKeys, [createdToken.id]: res.data.plainToken });
        setTokens([createdToken, ...tokens]);
        setSelectedToken(createdToken);
        setIsCreating(false);
        setNewTokenName('');
        setNewAgentId('');
        setNewTokenPermissions(defaultFullSyncPermissions);
      } else {
        setError(res.message || '令牌创建失败');
      }
    } catch {
      setError('令牌创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const res = await deleteAgentTokenApi(id);
      if (res.code === 200) {
        setTokens(tokens.filter(t => t.id !== id));
        if (selectedToken?.id === id) {
          setSelectedToken(null);
        }
      } else {
        setError(res.message || '令牌删除失败');
      }
    } catch {
      setError('令牌删除失败');
    }
  };

  const updateNewTokenPermissions = (key: keyof typeof newTokenPermissions) => {
    setNewTokenPermissions({ ...newTokenPermissions, [key]: !newTokenPermissions[key] });
  };

  const startEditToken = () => {
    if (!selectedToken) return;
    setEditTokenName(selectedToken.name);
    setEditAgentId(selectedToken.agentId || '');
    setEditTokenPermissions(permissionsFromToken(selectedToken));
    setIsEditingToken(true);
  };

  const updateEditTokenPermissions = (key: TokenPermissionKey) => {
    setEditTokenPermissions({ ...editTokenPermissions, [key]: !editTokenPermissions[key] });
  };

  const saveTokenPermissions = async () => {
    if (!selectedToken || !editTokenName.trim()) return;
    try {
      setError(null);
      const res = await updateAgentTokenApi(selectedToken.id, tokenPayload(editTokenName, editAgentId, editTokenPermissions));
      if (res.code === 200) {
        setSelectedToken(res.data);
        setTokens(tokens.map(token => token.id === res.data.id ? res.data : token));
        setIsEditingToken(false);
      } else {
        setError(res.message || '令牌更新失败');
      }
    } catch {
      setError('令牌更新失败');
    }
  };

  const enabledPermissionsFor = (token: AgentToken) => {
    const permissions = permissionsFromToken(token);
    return permissionOptions.filter(permission => permissions[permission.key]);
  };

  const copyToClipboard = async (text: string, type: 'key' | 'code') => {
    if (!text) {
      return;
    }
    try {
      await writeClipboardText(text);
      if (type === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      setError('复制失败，请手动复制');
    }
  };

  const renderDetail = () => {
    const copyableKey = copyableTokenKey(selectedToken, plainTokenKeys);
    const displayKey = copyableKey || selectedToken!.key;
    const exampleToken = copyableKey || '<AGENT_TOKEN>';
    const curlCode = `curl -X GET "http://localhost:8080/api/ai/token/me" \\
     -H "Authorization: Bearer ${exampleToken}"`;
    const syncCode = `curl -X POST "http://localhost:8080/api/ai/agents/register" \\
     -H "Authorization: Bearer ${exampleToken}" \\
     -H "Content-Type: application/json" \\
     -d '{
       "name": "Local Agent",
       "role": "研发助手",
       "description": "通过 Agent Token 自注册的平台智能体。",
       "skills": [
         {"name": "Repository Reader", "description": "读取项目结构", "sourceType": "agent-sync"}
       ],
       "memories": [
         {"title": "接入方式", "content": "使用知栈 Agent Token 同步。", "memoryType": "fact", "importance": 8}
       ]
     }'`;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
      >
        <button 
          onClick={() => setSelectedToken(null)}
          className="flex items-center text-sm font-black text-[#888] hover:text-[#1A1A1A] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 返回令牌列表
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b-2 border-dashed border-[#E0E0E0]">
          <div className="min-w-0">
            {isEditingToken ? (
              <input
                value={editTokenName}
                onChange={(event) => setEditTokenName(event.target.value)}
                className="w-full text-xl sm:text-2xl font-black text-[#1A1A1A] mb-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl px-3 py-2 outline-none"
              />
            ) : (
              <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] mb-2 break-words">{selectedToken!.name}</h3>
            )}
            <p className="text-sm font-bold text-[#888]">创建于 {selectedToken!.createdAt} • 最后使用 {selectedToken!.lastUsed} • 绑定 {agentNameFor(selectedToken!.agentId)}</p>
          </div>
          <div className="flex items-center gap-3">
            {isEditingToken ? (
              <button
                onClick={saveTokenPermissions}
                className="p-3 bg-[#4CAF50] text-white border-2 border-[#1A1A1A] rounded-xl transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
                title="保存权限"
              >
                <Save className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={startEditToken}
                className="p-3 bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
                title="编辑权限"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => handleDelete(selectedToken!.id)}
              className="p-3 bg-[#FFF0F0] text-[#FF5F56] border-2 border-[#FF5F56] rounded-xl hover:bg-[#FF5F56] hover:text-white transition-colors shadow-[2px_2px_0px_0px_#FF5F56]"
              title="删除令牌"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        {error && <p className="text-sm font-black text-[#FF6B6B] mb-4">{error}</p>}

        <div className="space-y-8">
          <section>
            <h4 className="flex items-center text-lg font-black text-[#1A1A1A] mb-4">
              <Bot className="w-5 h-5 mr-2 text-[#1976D2]" /> 绑定范围
            </h4>
            {isEditingToken ? (
              <select
                value={editAgentId}
                onChange={(event) => setEditAgentId(event.target.value)}
                className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none"
              >
                <option value="">全局令牌（同一账号下所有 Agent）</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-black text-[#1A1A1A]">
                {agentNameFor(selectedToken!.agentId)}
              </div>
            )}
            <p className="mt-3 text-xs font-bold text-[#888]">
              给 B 拉取 A 配置时，请把令牌绑定到 A，并仅开启读取类权限。
            </p>
          </section>

          <section>
            <h4 className="flex items-center text-lg font-black text-[#1A1A1A] mb-4">
              <Key className="w-5 h-5 mr-2 text-[#FF9800]" /> API Key
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl p-4">
              <code className="flex-1 text-lg font-mono font-bold text-[#1A1A1A] break-all">{displayKey}</code>
              <button
                onClick={() => copyToClipboard(copyableKey, 'key')}
                disabled={!copyableKey}
                className="px-4 py-2 bg-[#1A1A1A] text-white font-black rounded-lg border-2 border-[#1A1A1A] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#FFD93D] active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {copiedKey ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copyableKey ? (copiedKey ? '已复制' : '复制完整 Key') : '仅创建时可复制'}
              </button>
            </div>
            {!copyableKey && (
              <p className="mt-3 text-xs font-bold text-[#888]">
                出于安全考虑，平台只保存令牌哈希，完整 Key 只在创建成功后显示一次。当前为脱敏前缀，不能用于调用接口。
              </p>
            )}
          </section>

          <section>
            <h4 className="flex items-center text-lg font-black text-[#1A1A1A] mb-4">
              <Shield className="w-5 h-5 mr-2 text-[#4CAF50]" /> {isEditingToken ? '编辑权限配置' : '已开启权限'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(isEditingToken ? permissionOptions : enabledPermissionsFor(selectedToken!)).map((permission) => {
                const enabled = isEditingToken ? editTokenPermissions[permission.key] : permissionsFromToken(selectedToken!)[permission.key];
                return (
                  <button
                    type="button"
                    key={permission.key}
                    onClick={() => isEditingToken && updateEditTokenPermissions(permission.key)}
                    className={`p-4 border-2 rounded-xl transition-all text-left ${
                      enabled
                        ? 'border-[#1A1A1A] bg-[#FFD93D] shadow-[2px_2px_0px_0px_#1A1A1A]'
                        : 'border-[#E0E0E0] bg-white opacity-60'
                    } ${isEditingToken ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-[#1A1A1A]">{permission.label}</span>
                      {enabled && <CheckCircle2 className="w-5 h-5 text-[#1A1A1A]" />}
                    </div>
                    <p className="text-xs font-bold text-[#555]">{permission.description}</p>
                  </button>
                );
              })}
            </div>
            {!isEditingToken && enabledPermissionsFor(selectedToken!).length === 0 && (
              <p className="text-sm font-bold text-[#888]">该令牌未开启任何权限。</p>
            )}
          </section>

          <section>
            <h4 className="flex items-center text-lg font-black text-[#1A1A1A] mb-4">
              <Terminal className="w-5 h-5 mr-2 text-[#9C27B0]" /> AI 接入指南
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[
                '1. 调用 /api/ai/token/me 检查令牌和权限',
                '2. 未绑定 Agent 时调用 /api/ai/agents/register 自注册',
                '3. 调用 /api/ai/skills 上传工具手册和脚本',
                '4. 调用 /api/ai/agents/{agentId}/sync 同步记忆和目标',
                '5. 调用 /api/ai/agents/{agentId}/events 轮询平台变更',
                '6. 有事件时调用 /api/ai/agents/{agentId}/config 拉取搭配',
                '7. 应用配置后调用 /api/ai/events/{eventId}/ack',
                '8. 迁移前调用 /api/ai/agents/{agentId}/backup 导出备份',
              ].map((item) => (
                <div key={item} className="p-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-xs font-black text-[#1A1A1A]">
                  {item}
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] bg-[#1E1E1E]">
              <div className="bg-[#2D2D2D] px-4 py-3 border-b-2 border-[#1A1A1A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#A0A0A0]" />
                  <span className="text-xs font-mono font-bold text-[#A0A0A0]">cURL / token self-check</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(curlCode, 'code')}
                  className="text-[#A0A0A0] hover:text-white transition-colors"
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="p-4 text-[#E0E0E0] text-sm font-mono overflow-x-auto whitespace-pre">
                {curlCode}
              </pre>
            </div>
            <div className="mt-4 rounded-xl overflow-hidden border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] bg-[#1E1E1E]">
              <div className="bg-[#2D2D2D] px-4 py-3 border-b-2 border-[#1A1A1A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#A0A0A0]" />
                  <span className="text-xs font-mono font-bold text-[#A0A0A0]">cURL / agent register</span>
                </div>
                <button
                  onClick={() => copyToClipboard(syncCode, 'code')}
                  className="text-[#A0A0A0] hover:text-white transition-colors"
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="p-4 text-[#E0E0E0] text-sm font-mono overflow-x-auto whitespace-pre">
                {syncCode}
              </pre>
            </div>
            <div className="mt-4 p-4 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl">
              <p className="text-sm font-black text-[#1A1A1A] mb-2">脚本环境变量</p>
              <code className="block text-xs font-mono font-bold text-[#2D2D2D]">
                LOBSTER_API_BASE_URL=http://localhost:8080<br />
                LOBSTER_AGENT_TOKEN={exampleToken}
              </code>
            </div>
          </section>
        </div>
      </motion.div>
    );
  };

  const renderList = () => {
    return (
    <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-[#1A1A1A]">全部令牌</h3>
          <p className="text-sm font-bold text-[#888]">生成和管理用于外部系统调用的 API Keys</p>
          {error && <p className="text-sm font-black text-[#FF6B6B] mt-2">{error}</p>}
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-[#FFD93D] text-[#1A1A1A] font-black rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 新建令牌
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl p-4 sm:p-6 mb-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
              <h3 className="text-lg font-black text-[#1A1A1A] mb-4">创建一个新访问令牌</h3>
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewTokenPermissions(defaultFullSyncPermissions)}
                  className="px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-black hover:bg-[#FFD93D] transition-colors"
                >
                  完整同步预设
                </button>
                <button
                  type="button"
                  onClick={() => setNewTokenPermissions(defaultReadOnlyPullPermissions)}
                  className="px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-black hover:bg-[#E3F2FD] transition-colors"
                >
                  只读拉取预设
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-black text-[#1A1A1A] mb-2">令牌名称用途备注</label>
                  <input
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="例如: 生产环境 API 密钥, CI/CD 测试密钥"
                    className="w-full px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-bold focus:shadow-[2px_2px_0px_0px_#1A1A1A] outline-none transition-shadow"
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-black text-[#1A1A1A] mb-2">绑定 Agent</label>
                  <select
                    value={newAgentId}
                    onChange={(event) => setNewAgentId(event.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none"
                  >
                    <option value="">全局令牌</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleCreate}
                  className="px-6 py-3 bg-[#1A1A1A] text-white font-black rounded-xl border-2 border-[#1A1A1A] transition-colors hover:bg-gray-800"
                >
                  确认生成
                </button>
                <button 
                  onClick={() => { setIsCreating(false); setNewTokenName(''); setNewAgentId(''); }}
                  className="px-6 py-3 bg-white text-[#1A1A1A] font-black rounded-xl border-2 border-[#1A1A1A] transition-colors hover:bg-gray-100"
                >
                  取消
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {permissionOptions.map((permission) => (
                  <button
                    key={permission.key}
                    onClick={() => updateNewTokenPermissions(permission.key)}
                    className={`px-3 py-2 rounded-lg border-2 border-[#1A1A1A] text-xs font-black ${newTokenPermissions[permission.key] ? 'bg-[#FFD93D]' : 'bg-white'}`}
                  >
                    {permission.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {tokens.length === 0 ? (
          <div className="p-8 text-center bg-white border-2 border-dashed border-[#E0E0E0] rounded-2xl">
            <Key className="w-8 h-8 mx-auto text-[#E0E0E0] mb-3" />
            <p className="text-sm font-bold text-[#888]">暂未创建任何令牌</p>
          </div>
        ) : (
          tokens.map((token) => (
            <motion.div 
              key={token.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedToken(token)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[6px_6px_0px_0px_#FFD93D] hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="p-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl group-hover:bg-[#FFD93D] transition-colors">
                  <Key className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="font-black text-[#1A1A1A] text-lg mb-1">{token.name}</h3>
                  <p className="text-xs font-bold text-[#888] font-mono break-all">
                    {token.id} • 最近使用: {token.lastUsed}
                  </p>
                  <p className="text-xs font-bold text-[#555] mt-1">绑定：{agentNameFor(token.agentId)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {token.skillRead && <span className="px-2 py-1 bg-[#FFD93D]/20 text-[#1A1A1A] text-[10px] font-black uppercase rounded-md border border-[#FFD93D]">Skill Read</span>}
                {token.skillWrite && <span className="px-2 py-1 bg-[#FFEDEB] text-[#1A1A1A] text-[10px] font-black uppercase rounded-md border border-[#FF6B6B]">Skill Write</span>}
                {token.memoryRead && <span className="px-2 py-1 bg-[#A5D6A7]/30 text-[#1A1A1A] text-[10px] font-black uppercase rounded-md border border-[#A5D6A7]">Memory Read</span>}
                {token.memoryWrite && <span className="px-2 py-1 bg-[#E8F5E9] text-[#1A1A1A] text-[10px] font-black uppercase rounded-md border border-[#4CAF50]">Memory Write</span>}
                {token.goalRead && <span className="px-2 py-1 bg-[#90CAF9]/30 text-[#1A1A1A] text-[10px] font-black uppercase rounded-md border border-[#90CAF9]">Goal Read</span>}
                {token.goalWrite && <span className="px-2 py-1 bg-[#E3F2FD] text-[#1A1A1A] text-[10px] font-black uppercase rounded-md border border-[#1976D2]">Goal Write</span>}
                {token.agentSync && <span className="px-2 py-1 bg-[#FFEDEB] text-[#1A1A1A] text-[10px] font-black uppercase rounded-md border border-[#FF6B6B]">Sync</span>}
                {token.configRead && <span className="px-2 py-1 bg-[#E3F2FD] text-[#1A1A1A] text-[10px] font-black uppercase rounded-md border border-[#90CAF9]">Config</span>}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 pb-12 max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-3 border-b-2 border-[#1A1A1A] pb-6 mb-8 min-w-0">
        <Link to="/app/profile" className="p-2 border-2 border-[#1A1A1A] rounded-lg hover:bg-gray-50 shadow-[2px_2px_0px_0px_#1A1A1A] transition-all">
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </Link>
        <span className="text-xl font-bold text-[#888]">/</span>
        <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] truncate">访问令牌 (API Keys)</h2>
      </div>

      {selectedToken ? renderDetail() : renderList()}
    </motion.div>
  );
}
