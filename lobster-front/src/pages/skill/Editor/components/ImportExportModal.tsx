import React, { useRef, useState } from 'react';
import { UploadCloud, Download, X, FileArchive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SkillConfig } from '../types';
import { parseSkillAssetPackage } from '../../../../utils/assetTransfer';
import { buildSkillZipPackage, parseSkillZipPackage } from '../../../../utils/skillZipTransfer';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SkillConfig;
  onImportConfig: (config: SkillConfig) => void;
}

const safeFilename = (value: string) => value.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]+/g, '-').replace(/^-+|-+$/g, '') || 'skill-package';

export default function ImportExportModal({ isOpen, onClose, config, onImportConfig }: ImportExportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const applyImportedConfig = (nextConfig: SkillConfig) => {
    onImportConfig({
      ...nextConfig,
      id: config.id,
      publishStatus: 'draft',
    });
  };

  const downloadZip = () => {
    const zip = buildSkillZipPackage(config);
    const blob = new Blob([zip], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename(config.name)}.skill.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setError('');
    setMessage('Skill ZIP 已导出');
  };

  const importSkillFile = async (file: File) => {
    try {
      const isZip = file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
      if (isZip) {
        const pkg = await parseSkillZipPackage(file);
        applyImportedConfig(pkg.skill);
        setError('');
        setMessage('已导入 Skill ZIP，保存后生效');
        return;
      }

      const pkg = parseSkillAssetPackage(JSON.parse(await file.text()));
      applyImportedConfig(pkg.skill);
      setError('');
      setMessage('已导入旧版 Skill JSON，保存后生效');
    } catch {
      setMessage('');
      setError('导入失败，请确认是 知栈 Skill ZIP 包或旧版 Skill JSON 包');
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importSkillFile(file);
    }
    event.target.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-8 max-w-xl w-full shadow-[8px_8px_0px_0px_#1A1A1A] relative"
          >
            <input ref={fileInputRef} type="file" accept=".zip,.json,application/zip,application/json" className="hidden" onChange={handleFileSelected} />
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
              title="关闭"
            >
              <X className="w-5 h-5 text-[#1A1A1A]" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#E3F2FD] border-2 border-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A]">
                <FileArchive className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#1A1A1A]">Skill ZIP 包</h2>
                <p className="text-sm font-bold text-[#888]">导入或导出当前编辑器文件夹</p>
              </div>
            </div>

            {(message || error) && (
              <div className={`mb-5 p-3 border-2 rounded-xl text-sm font-black ${error ? 'bg-[#FFF0F0] border-[#FF6B6B] text-[#B42318]' : 'bg-[#E8F5E9] border-[#4CAF50] text-[#1A1A1A]'}`}>
                {error || message}
              </div>
            )}

            <p className="text-sm font-bold text-[#666] mb-6 leading-relaxed">
              ZIP 包会包含 <span className="font-black text-[#1A1A1A]">skill.json</span> 元数据和 <span className="font-black text-[#1A1A1A]">files/</span> 下的完整文件树。导入会替换当前编辑器里的文件与配置，保存后才会写入平台。旧版 Skill JSON 仍可导入。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-6 bg-[#FAF9F6] border-2 border-dashed border-[#1A1A1A] rounded-2xl hover:bg-[#FFF4E0] hover:border-solid hover:shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-white border-2 border-[#1A1A1A] rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#1A1A1A] group-hover:bg-[#FFD93D]">
                  <UploadCloud className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <span className="text-sm font-black text-[#1A1A1A]">导入 Skill ZIP</span>
              </button>
              <button type="button" onClick={downloadZip} className="flex flex-col items-center justify-center gap-3 p-6 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-2xl hover:bg-[#E8F5E9] hover:shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-white border-2 border-[#1A1A1A] rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#1A1A1A] group-hover:bg-[#A5D6A7]">
                  <Download className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <span className="text-sm font-black text-[#1A1A1A]">导出 Skill ZIP</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
