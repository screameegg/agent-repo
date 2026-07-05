import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Smartphone } from 'lucide-react';
import TopBar from './components/TopBar';
import EditorSidebar from './components/EditorSidebar';
import SettingsPanel from './components/SettingsPanel';
import CodeArea from './components/CodeArea';
import ImportExportModal from './components/ImportExportModal';
import { SkillConfig, SkillFile } from './types';
import { createSkillApi, getSkillApi, toEditorConfig, updateSkillApi } from '../service';
import Toast, { ToastState } from '../../../components/Toast';
import { DESKTOP_EDITOR_MIN_WIDTH, shouldShowDesktopEditor } from '../../../utils/viewport';
import { cloneDefaultSkillFiles } from './defaultSkillTemplate';

function useViewportWidth() {
  const [width, setWidth] = useState(() => (
    typeof window === 'undefined' ? DESKTOP_EDITOR_MIN_WIDTH : window.innerWidth
  ));

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

export default function SkillEditor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const viewportWidth = useViewportWidth();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date>();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(20);

  const [config, setConfig] = useState<SkillConfig>({
    id: id || '',
    name: '',
    description: '',
    icon: '',
    runtimeEnvironments: [],
    coreCapabilities: [],
    files: cloneDefaultSkillFiles()
  });

  const configRef = useRef(config);
  const isDirtyRef = useRef(isDirty);
  const isSavingRef = useRef(isSaving);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    const loadSkill = async () => {
      if (!id || id.startsWith('new_')) {
        return;
      }
      const response = await getSkillApi(id);
      if (response.code === 200) {
        setConfig(toEditorConfig(response.data));
        setIsDirty(false);
      } else {
        setToast({ type: 'error', message: response.message || '加载技能失败' });
      }
    };
    loadSkill();
  }, [id, location.state]);

  useEffect(() => {
    // If state was passed from the creation modal, pre-fill it.
    if (location.state && (!id || id.startsWith('new_'))) {
      const isFork = location.state.isFork;
      setConfig(prev => ({
        ...prev,
        name: location.state.name || prev.name,
        description: location.state.desc || prev.description,
        icon: location.state.icon || prev.icon,
        files: isFork ? [
          {
            name: 'SKILL.md',
            path: 'SKILL.md',
            language: 'markdown',
            content: `---\nname: ${location.state.name.replace(' (副本)', '').toLowerCase().replace(/\\s+/g, '-')}\ndescription: ${location.state.desc}\n---\n\n# ${location.state.name}\n\n## Available Tools\n\n**GitHub Integration**: Read repositories, issues, and PRs.\n\n## Quick Search\n\nSearch through code efficiently:\n\n\`\`\`bash\ngrep -r "TODO" src/\n\`\`\`\n\nSee [reference/queries.md](reference/queries.md) for more advanced repository interaction patterns.`
          },
          {
            name: 'reference/queries.md',
            path: 'reference/queries.md',
            language: 'markdown',
            content: '# Advanced Queries Reference\n\nHow to get the most out of the repository structure.'
          },
          {
            name: 'scripts/analyze.py',
            path: 'scripts/analyze.py',
            language: 'python',
            content: '# Code analysis script\nimport os\ndef analyze_repo(path):\n    print(f"Analyzing {path}...")\n    return {"status": "success"}\n\nif __name__ == "__main__":\n    analyze_repo(".")'
          }
        ] : prev.files
      }));
    }
  }, [id, location.state]);

  const handleSave = async (options?: { auto?: boolean }) => {
    setIsSaving(true);
    try {
      const currentConfig = configRef.current;
      const payload = {
        ...currentConfig,
        name: currentConfig.name || '未命名技能',
        description: currentConfig.description || '',
      };
      const response = payload.id && !payload.id.startsWith('new_')
        ? await updateSkillApi(payload.id, payload)
        : await createSkillApi(payload);
      if (response.code === 200) {
        const nextConfig = toEditorConfig(response.data);
        setConfig({ ...nextConfig, id: response.data.id });
        setLastSaved(new Date());
        setIsDirty(false);
        if (response.data.auditStatus === 'pending' || response.data.publishStatus === 'pending') {
          setToast({ type: 'info', message: '已保存。内容命中敏感词检测，已重新提交管理员审核。' });
        } else {
          setToast({ type: 'success', message: options?.auto ? '已自动保存。' : '保存成功。' });
        }
        if (!payload.id || payload.id.startsWith('new_')) {
          navigate(`/app/profile/skill-editor/${response.data.id}`, { replace: true });
        }
      } else {
        setToast({ type: 'error', message: response.message || '保存失败' });
      }
    } catch {
      setToast({ type: 'error', message: '保存失败，请稍后重试' });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!autoSaveEnabled) {
      setAutoSaveCountdown(20);
      return;
    }
    const timer = window.setInterval(() => {
      setAutoSaveCountdown((value) => {
        const nextValue = value <= 1 ? 20 : value - 1;
        if (value <= 1 && isDirtyRef.current && !isSavingRef.current) {
          void handleSave({ auto: true });
        }
        return nextValue;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [autoSaveEnabled]);

  useEffect(() => {
    if (isDirty) {
      setAutoSaveCountdown(20);
    }
  }, [isDirty]);

  useEffect(() => {
    if (!isSaving) {
      return;
    }
    setAutoSaveCountdown(20);
  }, [isSaving]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config]);

  const handleTest = () => {
    setToast({ type: 'info', message: '正在云端沙箱隔离环境打包运行...' });
  };

  const updateFileContent = (content: string) => {
      const newFiles = [...config.files];
      if (newFiles[activeFileIndex]) {
       newFiles[activeFileIndex].content = content;
       setConfig({ ...config, files: newFiles });
       setIsDirty(true);
    }
  };

  const handleAddFile = (name: string, language: string, type: 'file' | 'folder' = 'file') => {
    if (type === 'file') {
      const newFile: SkillFile = { name, path: name, language, content: '' };
      setConfig(prev => ({ ...prev, files: [...prev.files, newFile] }));
      setActiveFileIndex(config.files.length);
      setIsDirty(true);
    } else {
      const keepPath = `${name}/.gitkeep`;
      const newFile: SkillFile = { name: keepPath, path: keepPath, language: 'plaintext', content: '' };
      setConfig(prev => ({ ...prev, files: [...prev.files, newFile] }));
      setActiveFileIndex(config.files.length);
      setIsDirty(true);
    }
  };

  const handleDeleteFile = (pathToRemove: string) => {
    setConfig(prev => {
      const updatedFiles = prev.files.filter(f => (f.path || f.name) !== pathToRemove);
      return { ...prev, files: updatedFiles };
    });
    setIsDirty(true);
    // Adjust active index if necessary
    setActiveFileIndex(0);
  };

  const handleDeleteFolder = (folderPath: string) => {
    setConfig(prev => {
      const updatedFiles = prev.files.filter(f => !(f.path || f.name).startsWith(folderPath + '/'));
      return { ...prev, files: updatedFiles };
    });
    setIsDirty(true);
    setActiveFileIndex(0);
  };

  const handleRenameItem = (oldPath: string, newName: string, isFolder: boolean) => {
    setConfig(prev => {
      const parentPath = oldPath.includes('/') ? oldPath.split('/').slice(0, -1).join('/') + '/' : '';
      const newPath = `${parentPath}${newName}`;
      
      const updatedFiles = prev.files.map(f => {
        const filePath = f.path || f.name;
        if (!isFolder && filePath === oldPath) {
          return { ...f, name: newPath, path: newPath };
        } else if (isFolder && filePath.startsWith(oldPath + '/')) {
          const remainder = filePath.slice(oldPath.length);
          return { ...f, name: `${newPath}${remainder}`, path: `${newPath}${remainder}` };
        }
        return f;
      });
      return { ...prev, files: updatedFiles };
    });
    setIsDirty(true);
  };

  const handleMoveItem = (oldPath: string, newParentFolder: string) => {
    setConfig(prev => {
      const updatedFiles = prev.files.map(f => {
        const filePath = f.path || f.name;
        if (filePath === oldPath) {
          const fileName = oldPath.split('/').pop() || oldPath;
          const newPath = newParentFolder ? `${newParentFolder}/${fileName}` : fileName;
          return { ...f, name: newPath, path: newPath };
        } else if (filePath.startsWith(oldPath + '/')) { // if renaming folder
          const remainder = filePath.slice(oldPath.length);
          const folderName = oldPath.split('/').pop() || oldPath;
          const newPath = newParentFolder ? `${newParentFolder}/${folderName}${remainder}` : `${folderName}${remainder}`;
          return { ...f, name: newPath, path: newPath };
        }
        return f;
      });
      return { ...prev, files: updatedFiles };
    });
    setIsDirty(true);
    setActiveFileIndex(0); // Optional, could ideally retain selection
  };

  if (!shouldShowDesktopEditor(viewportWidth)) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_#1A1A1A]">
          <div className="flex items-center justify-between gap-4 mb-6">
            <button
              type="button"
              onClick={() => navigate('/app/profile/published-skills')}
              className="p-2 bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A]"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFF4E0] border-2 border-[#1A1A1A] rounded-xl text-xs font-black text-[#1A1A1A]">
              <Smartphone className="w-4 h-4" />
              移动端
            </div>
          </div>

          <div className="w-16 h-16 bg-[#FFD93D] border-4 border-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A] mb-6">
            <Monitor className="w-8 h-8 text-[#1A1A1A]" />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A] leading-tight mb-3">
            Skill 编辑器暂未适配移动端
          </h1>
          <p className="text-sm font-bold text-[#555] leading-relaxed mb-6">
            代码编辑、文件树拖拽和配置面板需要更宽的操作空间。请移步 PC 或平板横屏体验更佳。
          </p>
          <div className="p-4 bg-[#F7FBFF] border-2 border-[#1A1A1A] rounded-2xl mb-6">
            <p className="text-xs font-black text-[#888] mb-1">建议窗口宽度</p>
            <p className="text-lg font-black text-[#1A1A1A]">{DESKTOP_EDITOR_MIN_WIDTH}px 以上</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/profile/published-skills')}
            className="w-full min-h-12 bg-[#1A1A1A] text-white border-2 border-[#1A1A1A] rounded-xl font-black shadow-[3px_3px_0px_0px_#FFD93D]"
          >
            返回我的技能
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full min-w-0 flex flex-col bg-[#F3F1EC] font-sans overflow-hidden">
      <TopBar 
        onSave={() => void handleSave()} 
        onTest={handleTest} 
        skillName={config.name}
        isDirty={isDirty}
        isSaving={isSaving}
        autoSaveEnabled={autoSaveEnabled}
        autoSaveCountdown={autoSaveCountdown}
        onToggleAutoSave={() => setAutoSaveEnabled((value) => !value)}
        lastSaved={lastSaved} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
      />
      <div className="flex-1 flex min-w-0 overflow-hidden">
        <EditorSidebar 
          files={config.files}
          activeFileIndex={activeFileIndex}
          setActiveFileIndex={setActiveFileIndex}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          onDeleteFolder={handleDeleteFolder}
          onRenameItem={handleRenameItem}
          onMoveItem={handleMoveItem}
        />
        <CodeArea file={config.files[activeFileIndex]} onChange={updateFileContent} />
      </div>

      <SettingsPanel 
        config={config} 
        onChange={(nextConfig) => {
          setConfig(nextConfig);
          setIsDirty(true);
        }} 
        onSave={() => void handleSave()}
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        config={config}
        onImportConfig={(nextConfig) => {
          setConfig(nextConfig);
          setActiveFileIndex(0);
          setIsDirty(true);
        }}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
