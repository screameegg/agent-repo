import React, { useState } from 'react';
import { Code2, FileCode2, PackageOpen, Plus, Check, X, FolderPlus, FilePlus, Folder as FolderIcon, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { SkillFile } from '../types';

interface EditorSidebarProps {
  files: SkillFile[];
  activeFileIndex: number;
  setActiveFileIndex: (idx: number) => void;
  onAddFile: (name: string, language: string, type?: 'file' | 'folder') => void;
  onDeleteFile?: (path: string) => void;
  onDeleteFolder?: (path: string) => void;
  onRenameItem?: (oldPath: string, newName: string, isFolder: boolean) => void;
  onMoveItem?: (oldPath: string, newParentFolder: string) => void;
}

interface FileNode {
  name: string;
  isFolder: boolean;
  children: Record<string, FileNode>;
  fileIndex: number;
  fullPath: string;
}

export default function EditorSidebar({
  files,
  activeFileIndex,
  setActiveFileIndex,
  onAddFile,
  onDeleteFile,
  onDeleteFolder,
  onRenameItem,
  onMoveItem
}: EditorSidebarProps) {
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingItem, setEditingItem] = useState<{ path: string, isFolder: boolean } | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeFolderPrefix, setActiveFolderPrefix] = useState(''); // Where to add new items
  const [draggedItem, setDraggedItem] = useState<{ path: string, isFolder: boolean } | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [path]: prev[path] === undefined ? false : !prev[path]
    }));
  };

  const isFolderExpanded = (path: string) => expandedFolders[path] !== false;

  const handleAdd = (type: 'file' | 'folder') => {
    const value = newName.trim().replace(/^\/+|\/+$/g, '');
    if (value) {
      const fullPath = activeFolderPrefix ? `${activeFolderPrefix}${value}` : value;
      
      if (type === 'file') {
        const ext = value.split('.').pop() || '';
        let lang = 'typescript';
        if (ext === 'json') lang = 'json';
        if (ext === 'js') lang = 'javascript';
        if (ext === 'md') lang = 'markdown';
        if (ext === 'html') lang = 'html';
        if (ext === 'css') lang = 'css';
        if (ext === 'py') lang = 'python';
        if (ext === 'sh' || ext === 'bash') lang = 'shell';
        
        onAddFile(fullPath, lang, 'file');
      } else {
        onAddFile(fullPath, '', 'folder');
      }
      
      setNewName('');
      setIsAddingFile(false);
      setIsAddingFolder(false);
      setActiveFolderPrefix('');
    }
  };

  const cancelAdd = () => {
    setNewName('');
    setIsAddingFile(false);
    setIsAddingFolder(false);
    setActiveFolderPrefix('');
  };

  const handleRenameSubmit = () => {
    if (editingItem && editingName.trim() && onRenameItem) {
      if (editingName !== editingItem.path.split('/').pop()) {
        onRenameItem(editingItem.path, editingName.trim(), editingItem.isFolder);
      }
    }
    setEditingItem(null);
    setEditingName('');
  };

  const handleDragStart = (e: React.DragEvent, path: string, isFolder: boolean) => {
    e.stopPropagation();
    setDraggedItem({ path, isFolder });
  };

  const handleDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;
    
    // Prevent dragging a folder into itself or its children
    if (draggedItem.isFolder && (folderPath === draggedItem.path || folderPath.startsWith(draggedItem.path + '/'))) {
      return;
    }

    // Prevent dropping if it's already in this folder
    const currentParent = draggedItem.path.includes('/') ? draggedItem.path.split('/').slice(0, -1).join('/') : '';
    if (currentParent === folderPath) {
      return;
    }

    setDragOverFolder(folderPath);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    if (draggedItem && onMoveItem) {
      // Basic check to see if it's not the same folder
      const currentParent = draggedItem.path.includes('/') ? draggedItem.path.split('/').slice(0, -1).join('/') : '';
      if (currentParent !== targetFolder) {
        onMoveItem(draggedItem.path, targetFolder);
      }
    }
    setDraggedItem(null);
  };

  // Build a simple tree for rendering
  const tree: Record<string, FileNode> = {};
  
  files.forEach((file, index) => {
    const fullName = file.path || file.name;
    const parts = fullName.split('/');
    let currentLevel = tree;
    let pathAcc = '';
    
    parts.forEach((part, i) => {
      pathAcc = pathAcc ? `${pathAcc}/${part}` : part;
      const isLast = i === parts.length - 1;
      
      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          isFolder: !isLast || part === '.gitkeep',
          children: {},
          fileIndex: isLast ? index : -1,
          fullPath: pathAcc
        };
      }
      
      if (!isLast) {
        currentLevel = currentLevel[part].children;
      }
    });
  });

  const renderTree = (nodes: Record<string, FileNode>, level: number = 0) => {
    return Object.values(nodes).sort((a, b) => {
      if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
      return a.isFolder ? -1 : 1;
    }).map(node => {
      // Don't show .gitkeep explicitly
      if (node.name === '.gitkeep') return null;
      
      const paddingLeft = `${(level * 12) + 12}px`;
      
      if (node.isFolder) {
        const isDragOver = dragOverFolder === node.fullPath;
        const expanded = isFolderExpanded(node.fullPath);
        return (
          <div key={node.fullPath}>
            <div 
              draggable
              onDragStart={(e) => handleDragStart(e, node.fullPath, true)}
              onDragOver={(e) => handleDragOver(e, node.fullPath)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, node.fullPath)}
              style={{ paddingLeft }}
              className={`w-full flex items-center justify-between py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer group ${isDragOver ? 'bg-blue-100 text-blue-700' : 'text-[#888] hover:bg-gray-100'}`}
              onClick={(e) => toggleFolder(e, node.fullPath)}
            >
              <div className="flex items-center truncate pr-2">
                 <button className="flex justify-center items-center w-[18px] h-[18px] rounded hover:bg-gray-200/50 text-[#888] transition-colors mr-1.5 shrink-0">
                    {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                 </button>
                 <FolderIcon className={`shrink-0 w-4 h-4 mr-2 ${isDragOver ? 'text-blue-500' : 'text-[#888]'}`} />
                 
                 {editingItem?.path === node.fullPath ? (
                    <input 
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit();
                        if (e.key === 'Escape') setEditingItem(null);
                      }}
                      onBlur={handleRenameSubmit}
                      autoFocus
                      className="flex-1 bg-white border border-[#1A1A1A] rounded px-1 text-sm text-[#1A1A1A] focus:outline-none min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                 ) : (
                    <span 
                      className="truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingItem({ path: node.fullPath, isFolder: true });
                        setEditingName(node.name);
                      }}
                    >
                      {node.name}
                    </span>
                 )}
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 pr-2 transition-opacity gap-0.5">
                 <button title="新建文件" onClick={(e) => { e.stopPropagation(); setActiveFolderPrefix(`${node.fullPath}/`); setIsAddingFile(true); setIsAddingFolder(false); if (!expanded) toggleFolder(e, node.fullPath); }} className="p-1 hover:bg-gray-200 rounded text-[#1A1A1A]"><FilePlus className="w-3 h-3" /></button>
                 <button title="新建文件夹" onClick={(e) => { e.stopPropagation(); setActiveFolderPrefix(`${node.fullPath}/`); setIsAddingFolder(true); setIsAddingFile(false); if (!expanded) toggleFolder(e, node.fullPath); }} className="p-1 hover:bg-gray-200 rounded text-[#1A1A1A]"><FolderPlus className="w-3 h-3" /></button>
                 {onDeleteFolder && (
                   <button title="删除文件夹" onClick={(e) => { e.stopPropagation(); onDeleteFolder(node.fullPath); }} className="p-1 hover:bg-red-200 hover:text-red-600 rounded text-[#1A1A1A] transition-colors"><Trash2 className="w-3 h-3" /></button>
                 )}
              </div>
            </div>
            {expanded && (
              <div>
                {renderTree(node.children, level + 1)}
              </div>
            )}
          </div>
        );
      }
      
      const isActive = activeFileIndex === node.fileIndex;
      return (
        <div key={node.fullPath} className="relative group">
          <button
            draggable
            onDragStart={(e) => handleDragStart(e, node.fullPath, false)}
            style={{ paddingLeft }}
            onClick={() => setActiveFileIndex(node.fileIndex)}
            className={`w-full flex items-center py-2 pr-8 rounded-lg text-sm font-bold transition-all border-2 mb-0.5 ${
              isActive
                ? 'bg-[#FFF4E0] border-[#1A1A1A] text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                : 'bg-transparent border-transparent text-[#555] hover:bg-gray-100 hover:text-[#1A1A1A]'
            }`}
          >
            <div className="w-[18px] shrink-0 mr-1.5" />
            <FileCode2 className={`shrink-0 w-4 h-4 mr-2 ${isActive ? 'text-[#FF9800]' : 'text-[#888]'}`} />
            
            {editingItem?.path === node.fullPath ? (
               <input 
                 type="text"
                 value={editingName}
                 onChange={(e) => setEditingName(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') handleRenameSubmit();
                   if (e.key === 'Escape') setEditingItem(null);
                 }}
                 onBlur={handleRenameSubmit}
                 autoFocus
                 className="flex-1 bg-white border border-[#1A1A1A] rounded px-1 text-sm text-[#1A1A1A] focus:outline-none min-w-0"
                 onClick={(e) => e.stopPropagation()}
               />
            ) : (
               <span 
                 className="truncate text-left"
                 onDoubleClick={(e) => {
                   e.stopPropagation();
                   setEditingItem({ path: node.fullPath, isFolder: false });
                   setEditingName(node.name);
                 }}
               >
                 {node.name}
               </span>
            )}
          </button>
          
          {onDeleteFile && (
             <button 
                title="删除文件"
                onClick={(e) => { e.stopPropagation(); onDeleteFile(node.fullPath); }} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-[#888] hover:bg-red-100 hover:text-red-500 rounded transition-all"
             >
                <Trash2 className="w-3 h-3" />
             </button>
          )}
        </div>
      );
    });
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    // Prevent dropping if it's already in root
    const currentParent = draggedItem.path.includes('/') ? draggedItem.path.split('/').slice(0, -1).join('/') : '';
    if (currentParent === '') return;

    setDragOverFolder('');
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    // root drop logic
    if (draggedItem && onMoveItem) {
       const currentParent = draggedItem.path.includes('/') ? draggedItem.path.split('/').slice(0, -1).join('/') : '';
       if (currentParent !== '') {
          onMoveItem(draggedItem.path, '');
       }
    }
    setDraggedItem(null);
  };

  return (
    <div className="hidden md:flex w-64 bg-white border-r-2 border-[#1A1A1A] flex-col shrink-0 z-10 relative shadow-[2px_0px_0px_0px_#1A1A1A]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b-2 border-[#1A1A1A] shrink-0">
             <div className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-wider flex items-center">
               <PackageOpen className="w-4 h-4 mr-1.5" />
               技能文件树
             </div>
             <div className="flex items-center gap-1">
               <button 
                 onClick={() => { setActiveFolderPrefix(''); setIsAddingFile(true); setIsAddingFolder(false); }}
                 className="p-1.5 hover:bg-gray-100 rounded-md text-[#1A1A1A] transition-colors border border-transparent hover:border-[#E0E0E0]"
                 title="新建根目录文件"
               >
                 <FilePlus className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => { setActiveFolderPrefix(''); setIsAddingFolder(true); setIsAddingFile(false); }}
                 className="p-1.5 hover:bg-gray-100 rounded-md text-[#1A1A1A] transition-colors border border-transparent hover:border-[#E0E0E0]"
                 title="新建根目录文件夹"
               >
                 <FolderPlus className="w-4 h-4" />
               </button>
             </div>
          </div>
          
          <div 
             className={`flex-1 overflow-y-auto px-2 py-3 custom-scrollbar transition-colors ${dragOverFolder === '' ? 'bg-blue-50/50' : ''}`}
             onDragOver={handleRootDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleRootDrop}
          >
             {renderTree(tree)}

             {(isAddingFile || isAddingFolder) && (
               <div 
                  className="px-2 py-2 bg-gray-50 border-2 border-[#1A1A1A] rounded-lg mt-2 flex items-center gap-2 shadow-[2px_2px_0px_0px_#1A1A1A]"
                  style={{ marginLeft: activeFolderPrefix ? `${(activeFolderPrefix.split('/').length - 1) * 12 + 12}px` : '0' }}
               >
                  {isAddingFolder ? <FolderIcon className="w-4 h-4 text-[#888] shrink-0" /> : <FileCode2 className="w-4 h-4 text-[#888] shrink-0" />}
                  <input 
                    autoFocus
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={() => {
                      if (newName.trim()) {
                        handleAdd(isAddingFolder ? 'folder' : 'file');
                      } else {
                        cancelAdd();
                      }
                    }}
                    placeholder={isAddingFolder ? "文件夹名称" : "filename.ts"}
                    className="w-full bg-transparent text-sm font-bold text-[#1A1A1A] outline-none min-w-[50px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd(isAddingFolder ? 'folder' : 'file');
                      if (e.key === 'Escape') cancelAdd();
                    }}
                  />
                  <div className="flex shrink-0">
                    <button onMouseDown={(event) => event.preventDefault()} onClick={() => handleAdd(isAddingFolder ? 'folder' : 'file')} className="p-0.5 text-[#4CAF50] hover:bg-green-100 rounded"><Check className="w-3 h-3" /></button>
                    <button onMouseDown={(event) => event.preventDefault()} onClick={cancelAdd} className="p-0.5 text-[#FF5F56] hover:bg-red-100 rounded"><X className="w-3 h-3" /></button>
                  </div>
               </div>
             )}
          </div>
        </div>
    </div>
  );
}
