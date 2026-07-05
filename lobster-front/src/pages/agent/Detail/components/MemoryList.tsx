import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Brain, CheckSquare, Clock, Copy, Download, Filter, Import, Search, Square, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentMemory } from '../../types';
import { buildMemoryAssetPackage, formatMemoryPrompt, parseMemoryAssetPackage } from '../../../../utils/assetTransfer';
import { writeClipboardText } from '../../../../utils/clipboard';

interface MemoryListProps {
  memories: AgentMemory[];
  onCreateMemory: (data: {
    title: string;
    content: string;
    memoryType?: string;
    importance?: number;
    source?: string;
  }) => Promise<void>;
  onDeleteMemory: (memoryId: string) => Promise<void>;
}

const memoryTypeLabel = (type?: string) => {
  if (type === 'fact') return '事实';
  if (type === 'preference') return '偏好';
  if (type === 'workflow') return '流程';
  if (type === 'decision') return '决策';
  if (type === 'context') return '上下文';
  return '笔记';
};

const memoryTypeClass = (type?: string) => {
  if (type === 'fact') return 'bg-[#E8F5E9] text-[#1B5E20]';
  if (type === 'preference') return 'bg-[#E3F2FD] text-[#0D47A1]';
  if (type === 'workflow') return 'bg-[#FFF8D8] text-[#1A1A1A]';
  if (type === 'decision') return 'bg-[#FFEDEB] text-[#B42318]';
  if (type === 'context') return 'bg-[#F3E5F5] text-[#4A148C]';
  return 'bg-[#F5F5F5] text-[#555]';
};

const downloadJson = (filename: string, value: unknown) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function MemoryList({ memories, onCreateMemory, onDeleteMemory }: MemoryListProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [importanceFilter, setImportanceFilter] = useState('all');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    content: '',
    memoryType: 'note',
    importance: 5,
  });

  const selectedMemory = memories.find(m => m.id === selectedMemoryId);
  const filteredMemories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return memories.filter((memory) => {
      const matchesQuery = !query || `${memory.title} ${memory.content} ${memory.source || ''}`.toLowerCase().includes(query);
      const matchesType = typeFilter === 'all' || memory.memoryType === typeFilter;
      const matchesImportance = importanceFilter === 'all'
        || (importanceFilter === 'high' && (memory.importance ?? 0) >= 8)
        || (importanceFilter === 'normal' && (memory.importance ?? 0) < 8);
      return matchesQuery && matchesType && matchesImportance;
    });
  }, [importanceFilter, memories, search, typeFilter]);

  const selectedMemories = selectedIds.length > 0
    ? memories.filter((memory) => selectedIds.includes(memory.id))
    : filteredMemories;

  const clearMessages = () => {
    setError('');
    setMessage('');
  };

  const toggleSelected = (memoryId: string) => {
    setSelectedIds((current) => current.includes(memoryId)
      ? current.filter((id) => id !== memoryId)
      : [...current, memoryId]);
  };

  const exportMemories = () => {
    if (selectedMemories.length === 0) {
      setError('没有可导出的记忆');
      return;
    }
    clearMessages();
    downloadJson('lobster-memory-package.json', buildMemoryAssetPackage(selectedMemories));
    setMessage(`已导出 ${selectedMemories.length} 条记忆`);
  };

  const copySelectedAsPrompt = async () => {
    if (selectedMemories.length === 0) {
      setError('没有可复制的记忆');
      return;
    }
    try {
      clearMessages();
      await writeClipboardText(selectedMemories.map(formatMemoryPrompt).join('\n\n---\n\n'));
      setMessage(`已复制 ${selectedMemories.length} 条记忆提示词`);
    } catch {
      setError('复制失败');
    }
  };

  const importMemoryPackage = async (file: File) => {
    try {
      setWorking(true);
      clearMessages();
      const raw = await file.text();
      const pkg = parseMemoryAssetPackage(JSON.parse(raw));
      for (const memory of pkg.memories) {
        await onCreateMemory({
          title: memory.title,
          content: memory.content,
          memoryType: memory.memoryType,
          importance: memory.importance,
          source: memory.source || 'import',
        });
      }
      setMessage(`已导入 ${pkg.memories.length} 条记忆`);
      setSelectedIds([]);
    } catch {
      setError('导入失败，请确认是 知栈记忆包 JSON');
    } finally {
      setWorking(false);
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importMemoryPackage(file);
    }
    event.target.value = '';
  };

  return (
    <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col h-full min-h-[400px] relative overflow-hidden">
      <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileSelected} />
      <AnimatePresence mode="wait">
        {!selectedMemoryId ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base sm:text-lg font-black flex items-center gap-3 text-[#1A1A1A]">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#E3F2FD] rounded border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
                    <Brain className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  长期记忆库
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={copySelectedAsPrompt} disabled={working || selectedMemories.length === 0} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#1A1A1A] rounded-lg text-xs font-black bg-white disabled:opacity-50">
                    <Copy className="w-3.5 h-3.5" />复制提示词
                  </button>
                  <button type="button" onClick={exportMemories} disabled={working || selectedMemories.length === 0} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#1A1A1A] rounded-lg text-xs font-black bg-[#E8F5E9] disabled:opacity-50">
                    <Download className="w-3.5 h-3.5" />导出
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={working} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#1A1A1A] rounded-lg text-xs font-black bg-[#FFF8D8] disabled:opacity-50">
                    <Import className="w-3.5 h-3.5" />导入
                  </button>
                </div>
              </div>
              <p className="text-xs font-bold text-[#666] leading-relaxed">
                把反复告诉 AI 的背景、偏好和决策沉淀成可复制、可导入、可迁移的记忆资产。
              </p>
            </div>

            {(message || error) && (
              <div className={`mb-3 p-3 border-2 rounded-xl text-xs font-black ${error ? 'bg-[#FFF0F0] border-[#FF6B6B] text-[#B42318]' : 'bg-[#E8F5E9] border-[#4CAF50] text-[#1A1A1A]'}`}>
                {error || message}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_140px_140px] gap-3 mb-4 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="检索记忆、来源或内容..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F5F5F5] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none focus:bg-white transition-all focus:-translate-y-0.5 focus:shadow-[2px_2px_0px_0px_#1A1A1A]"
                />
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
              </div>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="px-3 py-3 bg-[#F5F5F5] border-2 border-[#1A1A1A] rounded-xl text-sm font-black outline-none">
                <option value="all">全部类型</option>
                <option value="fact">事实</option>
                <option value="preference">偏好</option>
                <option value="workflow">流程</option>
                <option value="decision">决策</option>
                <option value="context">上下文</option>
                <option value="note">笔记</option>
              </select>
              <select value={importanceFilter} onChange={(event) => setImportanceFilter(event.target.value)} className="px-3 py-3 bg-[#F5F5F5] border-2 border-[#1A1A1A] rounded-xl text-sm font-black outline-none">
                <option value="all">全部权重</option>
                <option value="high">高权重</option>
                <option value="normal">普通权重</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 mb-2 text-xs font-black text-[#888]">
              <span><Filter className="inline w-3.5 h-3.5 mr-1" />{filteredMemories.length} 条匹配，已选 {selectedIds.length} 条</span>
              <button type="button" onClick={() => setSelectedIds(selectedIds.length ? [] : filteredMemories.map((memory) => memory.id))} className="text-[#1A1A1A] underline underline-offset-2">
                {selectedIds.length ? '清空选择' : '全选当前'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 sm:px-2 pt-2 pb-2 custom-scrollbar">
              <AnimatePresence>
                {filteredMemories.map(memory => {
                  const selected = selectedIds.includes(memory.id);
                  return (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 bg-[#FDFCFB] border-2 border-[#1A1A1A] rounded-2xl relative group hover:shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <button type="button" onClick={() => toggleSelected(memory.id)} className="mt-0.5 text-[#1A1A1A]" title={selected ? '取消选择' : '选择记忆'}>
                          {selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </button>
                        <button type="button" onClick={() => setSelectedMemoryId(memory.id)} className="min-w-0 flex-1 text-left">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-[10px] font-black border-2 border-[#1A1A1A] rounded-full ${memoryTypeClass(memory.memoryType)}`}>{memoryTypeLabel(memory.memoryType)}</span>
                            <span className="text-[10px] font-black text-[#888]">重要度 {memory.importance ?? 5}/10</span>
                            {memory.source && <span className="text-[10px] font-black text-[#888] truncate">来源 {memory.source}</span>}
                          </div>
                          <h3 className="text-sm font-black text-[#1A1A1A] mb-2 line-clamp-1">{memory.title}</h3>
                          <p className="text-sm leading-relaxed font-medium text-[#2D2D2D] line-clamp-2">{memory.content}</p>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filteredMemories.length === 0 && (
                <div className="py-10 text-center text-sm font-black text-[#888]">暂无记忆</div>
              )}

              <motion.button
                type="button"
                onClick={() => { clearMessages(); setShowCreateModal(true); }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 py-4 mt-2 border-[3px] border-dashed border-[#E0E0E0] rounded-2xl text-sm font-black text-[#888] cursor-pointer hover:border-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-colors select-none"
              >
                + 注入新记忆
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-[#E0E0E0] shrink-0">
              <button
                onClick={() => setSelectedMemoryId(null)}
                className="p-1.5 border-2 border-[#1A1A1A] rounded-lg hover:bg-[#F5F5F5] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all cursor-pointer"
                title="返回"
              >
                <ArrowLeft className="w-4 h-4 text-[#1A1A1A]" />
              </button>
              <h2 className="text-base font-black text-[#1A1A1A]">记忆详情</h2>
              <button
                type="button"
                disabled={!selectedMemory}
                onClick={async () => {
                  if (!selectedMemory) return;
                  try {
                    clearMessages();
                    await writeClipboardText(formatMemoryPrompt(selectedMemory));
                    setMessage('记忆提示词已复制');
                  } catch {
                    setError('复制失败');
                  }
                }}
                className="ml-auto p-1.5 border-2 border-[#1A1A1A] rounded-lg bg-[#E8F5E9] hover:bg-[#D7F0DA] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-60"
                title="复制为提示词"
              >
                <Copy className="w-4 h-4 text-[#1A1A1A]" />
              </button>
              <button
                type="button"
                disabled={deleting || !selectedMemory}
                onClick={async () => {
                  if (!selectedMemory || !window.confirm('确认删除这条记忆？')) return;
                  try {
                    setDeleting(true);
                    clearMessages();
                    await onDeleteMemory(selectedMemory.id);
                    setSelectedMemoryId(null);
                  } catch {
                    setError('记忆删除失败');
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="p-1.5 border-2 border-[#1A1A1A] rounded-lg bg-[#FFEDEB] hover:bg-[#FFDAD6] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-60"
                title="删除记忆"
              >
                <Trash2 className="w-4 h-4 text-[#1A1A1A]" />
              </button>
            </div>

            {(message || error) && (
              <div className={`mb-3 p-3 border-2 rounded-xl text-xs font-black ${error ? 'bg-[#FFF0F0] border-[#FF6B6B] text-[#B42318]' : 'bg-[#E8F5E9] border-[#4CAF50] text-[#1A1A1A]'}`}>
                {error || message}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              <div>
                <h3 className="text-base font-black text-[#1A1A1A] leading-snug mb-3">记忆内容</h3>
                <div className="p-4 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm text-[#2D2D2D] leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedMemory?.content}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
                <div className="p-4 rounded-xl border-2 border-[#1A1A1A] bg-[#FDFCFB]">
                  <p className="text-xs font-bold text-[#888] mb-1">记忆类型</p>
                  <p className="text-sm font-black text-[#1A1A1A]">{memoryTypeLabel(selectedMemory?.memoryType)}</p>
                </div>
                <div className="p-4 rounded-xl border-2 border-[#1A1A1A] bg-[#FDFCFB]">
                  <p className="text-xs font-bold text-[#888] mb-1">权重</p>
                  <p className="text-sm font-black text-[#1A1A1A]">{selectedMemory?.importance ?? 5} / 10</p>
                </div>
              </div>

              <div className="shrink-0">
                <h4 className="text-sm font-black text-[#1A1A1A] mb-2">记录来源</h4>
                <div className="flex items-center text-sm font-bold text-[#444] bg-[#F5F5F5] px-3 py-2 rounded-lg border-2 border-[#1A1A1A]">
                  <Brain className="w-4 h-4 mr-2" />
                  {selectedMemory?.source || 'unknown'}
                </div>
              </div>

              <div className="shrink-0">
                <h4 className="text-sm font-black text-[#1A1A1A] mb-2">时间戳</h4>
                <div className="flex items-center text-sm font-bold text-[#444] bg-[#F5F5F5] px-3 py-2 rounded-lg border-2 border-[#1A1A1A]">
                  <Clock className="w-4 h-4 mr-2" />
                  {selectedMemory?.createdAt || '未记录'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[6px_6px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
                title="关闭"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
              <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] mb-6 pr-12">注入新记忆</h3>
              <div className="space-y-4">
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="记忆标题"
                  className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none focus:bg-white"
                />
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  placeholder="记忆内容"
                  className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none focus:bg-white resize-none custom-scrollbar"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="block text-xs font-black text-[#1A1A1A]">记忆分类</span>
                    <select
                      value={form.memoryType}
                      onChange={(event) => setForm({ ...form, memoryType: event.target.value })}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none"
                    >
                      <option value="note">笔记</option>
                      <option value="fact">事实</option>
                      <option value="preference">偏好</option>
                      <option value="workflow">流程</option>
                      <option value="decision">决策</option>
                      <option value="context">上下文</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs font-black text-[#1A1A1A]">重要等级</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={form.importance}
                      onChange={(event) => setForm({ ...form, importance: Number(event.target.value) })}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold outline-none"
                    />
                  </label>
                </div>
              </div>
              {error && <p className="mt-4 text-sm font-black text-[#FF6B6B]">{error}</p>}
              <button
                onClick={async () => {
                  if (!form.title.trim() || !form.content.trim()) {
                    setError('请填写标题和内容');
                    return;
                  }
                  try {
                    setSaving(true);
                    clearMessages();
                    await onCreateMemory({ ...form, source: 'manual' });
                    setForm({ title: '', content: '', memoryType: 'note', importance: 5 });
                    setShowCreateModal(false);
                  } catch {
                    setError('记忆保存失败');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="mt-6 w-full py-3 bg-[#1A1A1A] text-white font-black rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#FFD93D] disabled:opacity-70"
              >
                {saving ? '保存中...' : '保存记忆'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
