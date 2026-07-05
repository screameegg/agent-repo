import React, { useEffect, useRef, useState } from 'react';
import { Upload, Download, Share2, CheckCircle2, Brain, PackageOpen, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Agent } from '../../agent/types';
import { exportAgentBackupApi, exportAgentBackupZipApi, importAgentBackupApi, importAgentBackupZipApi, pageAgentsApi } from '../../agent/service';

export default function ImportExport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [snapshotText, setSnapshotText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const loadAgents = async () => {
    const response = await pageAgentsApi({ current: 1, size: 100 });
    if (response.code === 200) {
      setAgents(response.data.records);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  const downloadJson = (filename: string, value: unknown) => {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadBlob = (filename: string, value: Blob) => {
    const url = URL.createObjectURL(value);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!selectedAgentId) {
      setError('请选择需要导出的 Agent');
      return;
    }
    try {
      setWorking(true);
      setError('');
      const response = await exportAgentBackupApi(selectedAgentId);
      if (response.code !== 200) {
        setError(response.message || '导出失败');
        return;
      }
      downloadJson(`agent-backup-${selectedAgentId}.json`, response.data);
      setMessage('导出成功');
    } catch {
      setError('导出失败');
    } finally {
      setWorking(false);
    }
  };

  const handleExportZip = async () => {
    if (!selectedAgentId) {
      setError('请选择需要导出的 Agent');
      return;
    }
    try {
      setWorking(true);
      setError('');
      const blob = await exportAgentBackupZipApi(selectedAgentId);
      downloadBlob(`agent-backup-${selectedAgentId}.zip`, blob);
      setMessage('ZIP 导出成功');
    } catch {
      setError('ZIP 导出失败');
    } finally {
      setWorking(false);
    }
  };

  const handleShare = async () => {
    if (!selectedAgentId) {
      setError('请选择需要分享的 Agent');
      return;
    }
    try {
      setWorking(true);
      setError('');
      const response = await exportAgentBackupApi(selectedAgentId);
      if (response.code !== 200) {
        setError(response.message || '快照生成失败');
        return;
      }
      const text = JSON.stringify(response.data);
      await navigator.clipboard.writeText(text);
      setSnapshotText(text);
      setMessage('快照已复制');
    } catch {
      setError('快照生成失败');
    } finally {
      setWorking(false);
    }
  };

  const importBackup = async (rawText: string) => {
    try {
      setWorking(true);
      setError('');
      const backup = JSON.parse(rawText);
      const response = await importAgentBackupApi({ backup });
      if (response.code !== 200) {
        setError(response.message || '导入失败');
        return;
      }
      setMessage(`导入成功：${response.data.agent.name}`);
      setSnapshotText('');
      await loadAgents();
    } catch {
      setError('导入失败，请确认 JSON 格式正确');
    } finally {
      setWorking(false);
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        setWorking(true);
        setError('');
        const response = await importAgentBackupZipApi(file);
        if (response.code !== 200) {
          setError(response.message || 'ZIP 导入失败');
          return;
        }
        setMessage(`ZIP 导入成功：${response.data.agent.name}`);
        setSnapshotText('');
        await loadAgents();
      } catch {
        setError('ZIP 导入失败，请确认备份包完整');
      } finally {
        setWorking(false);
      }
    } else {
      await importBackup(await file.text());
    }
    event.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="border-b-2 border-[#1A1A1A] pb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">资产迁移</h2>
        <p className="text-[#888] font-bold text-sm mt-1">导入、导出和克隆 Agent、长期记忆与 Skill 文件资产</p>
      </div>

      {(message || error) && (
        <div className={`p-4 border-2 rounded-2xl font-black text-sm ${error ? 'bg-[#FFF0F0] border-[#FF6B6B] text-[#B42318]' : 'bg-[#E8F5E9] border-[#4CAF50] text-[#1A1A1A]'}`}>
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[3px_3px_0px_0px_#1A1A1A]">
          <div className="flex items-center gap-2 text-sm font-black text-[#1A1A1A] mb-2"><Download className="w-4 h-4" />完整 Agent 备份</div>
          <p className="text-xs font-bold text-[#666] leading-relaxed">用于克隆完整智能体资产：身份、记忆、目标、挂载关系和后端返回的 Skill 文件内容。</p>
        </div>
        <Link to="/app" className="p-4 bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between gap-2 text-sm font-black text-[#1A1A1A] mb-2"><span className="inline-flex items-center gap-2"><Brain className="w-4 h-4" />长期记忆包</span><ArrowRight className="w-4 h-4" /></div>
          <p className="text-xs font-bold text-[#666] leading-relaxed">进入 Agent 详情的长期记忆库，可筛选、复制提示词、导出 JSON、导入到当前 Agent。</p>
        </Link>
        <Link to="/app/profile/published-skills" className="p-4 bg-white border-2 border-[#1A1A1A] rounded-2xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between gap-2 text-sm font-black text-[#1A1A1A] mb-2"><span className="inline-flex items-center gap-2"><PackageOpen className="w-4 h-4" />Skill 文件包</span><ArrowRight className="w-4 h-4" /></div>
          <p className="text-xs font-bold text-[#666] leading-relaxed">进入 Skill 编辑器导入/导出 ZIP 文件包，迁移完整 Skill 元数据和文件树。</p>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FAF9F6] rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col items-center text-center"
        >
          <input ref={fileInputRef} type="file" accept="application/json,.json,application/zip,.zip" className="hidden" onChange={handleFileSelected} />
          <div className="w-20 h-20 bg-[#E3F2FD] border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-3xl flex items-center justify-center mb-6 text-[#1A1A1A]">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-[#1A1A1A] mb-3">导入资产</h3>
          <p className="text-sm font-bold text-[#888] mb-10 leading-relaxed max-w-sm">
            上传完整 Agent 备份 JSON / ZIP，或粘贴复制的快照 JSON，平台会克隆一个新的 Agent。记忆包和 Skill 包请使用上方对应入口。
          </p>

          <div className="w-full space-y-5 mt-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={working}
              className="w-full flex items-center justify-center px-4 py-4 bg-[#FFD93D] border-2 border-[#1A1A1A] text-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-xl hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all text-sm font-black cursor-pointer disabled:opacity-60"
            >
              <Upload className="w-4 h-4 mr-2" />
              上传配置文件
            </button>
            <textarea
              rows={5}
              value={snapshotText}
              onChange={(event) => setSnapshotText(event.target.value)}
              placeholder="粘贴分享快照 JSON..."
              className="w-full px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-sm font-bold focus:outline-none focus:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all resize-none custom-scrollbar"
            />
            <button
              onClick={() => importBackup(snapshotText)}
              disabled={working || !snapshotText.trim()}
              className="w-full px-6 py-3 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-gray-50 active:-translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all text-sm font-black shrink-0 cursor-pointer disabled:opacity-60"
            >
              解析并导入
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#FAF9F6] rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-[#FFF4E0] border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-3xl flex items-center justify-center mb-6 text-[#1A1A1A]">
            <Download className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-[#1A1A1A] mb-3">打包导出</h3>
          <p className="text-sm font-bold text-[#888] mb-10 leading-relaxed max-w-sm">
            JSON 适合接口调试和 Agent 拉取；ZIP 会把后端返回的 Skill 文件树展开成真实文件。记忆包和 Skill 包也可以在对应模块单独迁移。
          </p>

          <div className="w-full space-y-5 mt-auto">
            <select
              value={selectedAgentId}
              onChange={(event) => setSelectedAgentId(event.target.value)}
              className="w-full px-4 py-4 bg-white border-2 border-[#1A1A1A] rounded-xl font-bold text-sm focus:outline-none focus:-translate-y-0.5 focus:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all cursor-pointer appearance-none shadow-sm"
            >
              <option value="">选择需要迁出的 Agent ...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={handleExport}
                disabled={working}
                className="flex items-center justify-center px-4 py-4 bg-[#FF6B6B] border-2 border-[#1A1A1A] text-white shadow-[4px_4px_0px_0px_#1A1A1A] rounded-xl hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all text-[13px] font-black cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4 mr-2" />
                下载 JSON
              </button>
              <button
                onClick={handleExportZip}
                disabled={working}
                className="flex items-center justify-center px-4 py-4 bg-[#FFD93D] border-2 border-[#1A1A1A] text-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-xl hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all text-[13px] font-black cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4 mr-2" />
                下载 ZIP
              </button>
              <button
                onClick={handleShare}
                disabled={working}
                className="flex items-center justify-center px-4 py-4 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-xl hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all text-[13px] font-black cursor-pointer disabled:opacity-60"
              >
                <Share2 className="w-4 h-4 mr-2" />
                分享快照
              </button>
            </div>
            {message && !error && (
              <div className="flex items-center justify-center text-sm font-black text-[#1A1A1A]">
                <CheckCircle2 className="w-4 h-4 mr-2 text-[#4CAF50]" />
                {message}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
