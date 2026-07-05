import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Star, Users, CheckCircle2, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { getSkillApi, installSkillApi } from '../service';
import { SkillPackage } from '../Editor/types';
import { resolveSkillIcon } from '../../../utils/image';

export default function SkillDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [skill, setSkill] = useState<SkillPackage | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadSkill = async () => {
      if (!id) return;
      const response = await getSkillApi(id);
      if (response.code === 200) {
        setSkill(response.data);
      } else {
        setMessage(response.message || '技能不存在');
      }
    };
    loadSkill();
  }, [id]);

  const readme = useMemo(() => {
    return skill?.files?.find((file) => file.path?.toLowerCase().endsWith('skill.md') || file.path?.toLowerCase().endsWith('readme.md'));
  }, [skill]);

  const fileContents = useMemo(() => {
    return (skill?.files || []).filter((file) => file.nodeType !== 'folder' && file.content);
  }, [skill]);

  const handleInstall = async () => {
    if (!id) return;
    const response = await installSkillApi(id);
    setMessage(response.code === 200 ? '安装成功，可以在已安装技能中查看。' : response.message || '安装失败');
    if (response.code === 200) {
      setSkill(response.data);
    }
  };

  if (!skill) {
    const backTo = location.state?.from || '/app/market';
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 border-b-2 border-[#1A1A1A] pb-6">
          <Link to={backTo} className="p-2 border-2 border-[#1A1A1A] rounded-lg hover:bg-[#F5F5F5] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all">
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </Link>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A]">技能详情</h2>
        </div>
        <div className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-8 shadow-[6px_6px_0px_0px_#1A1A1A] font-black text-[#888]">
          {message || '加载中...'}
        </div>
      </div>
    );
  }

  const backTo = location.state?.from || '/app/market';
  const coreCapabilities = (skill.coreCapabilities || []).filter(Boolean);
  const runtimeEnvironments = (skill.runtimeEnvironments || []).filter(Boolean);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 border-b-2 border-[#1A1A1A] pb-6 min-w-0">
        <Link to={backTo} className="p-2 border-2 border-[#1A1A1A] rounded-lg hover:bg-[#F5F5F5] shadow-[2px_2px_0px_0px_#1A1A1A] transition-all">
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </Link>
        <span className="text-xl font-bold text-[#888]">/</span>
        <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A]">技能详情</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#FDFCFB] border-[3px] sm:border-4 border-[#1A1A1A] rounded-2xl sm:rounded-3xl shadow-[3px_3px_0px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center justify-center shrink-0">
              <img src={resolveSkillIcon(skill.icon, skill.name)} alt={skill.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] mb-2 break-words">{skill.name}</h1>
                  <p className="text-[#888] font-bold text-sm mb-4">{skill.author} · version {skill.version}</p>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center text-sm font-bold text-[#1A1A1A]">
                      <Star className="w-4 h-4 text-[#FFD93D] fill-[#FFD93D] mr-1" />
                      4.9 (128)
                    </span>
                    <span className="flex items-center text-sm font-bold text-[#1A1A1A]">
                      <Download className="w-4 h-4 mr-1" />
                      {skill.installCount} 安装
                    </span>
                  </div>
                </div>
                <button onClick={handleInstall} className="flex w-full md:w-auto items-center justify-center px-6 py-3 bg-[#FFD93D] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all font-black shrink-0">
                  <Download className="w-5 h-5 mr-2" />
                  安装到仓库
                </button>
              </div>
              {message && <p className="text-sm font-black text-[#4CAF50] mt-4">{message}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A]">
            <h3 className="text-xl font-black text-[#1A1A1A] mb-4">技能概述</h3>
            <p className="text-[#2D2D2D] font-medium leading-relaxed mb-6">
              {skill.description || '该技能包还没有填写概述。'}
            </p>
            <h4 className="text-lg font-black text-[#1A1A1A] mb-3">核心能力</h4>
            {coreCapabilities.length > 0 ? (
              <ul className="space-y-3">
                {coreCapabilities.map((capability) => (
                  <li key={capability} className="flex items-center text-sm font-bold text-[#2D2D2D]">
                    <CheckCircle2 className="w-5 h-5 text-[#4CAF50] mr-3 shrink-0" />
                    {capability}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-bold text-[#888]">暂无核心能力说明。</p>
            )}
            {readme?.content && (
              <pre className="mt-6 max-h-72 overflow-auto whitespace-pre-wrap bg-[#FAF9F6] border-2 border-[#1A1A1A] rounded-2xl p-4 text-xs font-bold text-[#2D2D2D]">
                {readme.content}
              </pre>
            )}
          </div>
          {fileContents.length > 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A]">
              <h3 className="text-xl font-black text-[#1A1A1A] mb-4">文件内容</h3>
              <div className="space-y-4">
                {fileContents.map((file) => (
                  <div key={file.path || file.name} className="border-2 border-[#1A1A1A] rounded-2xl overflow-hidden bg-[#FAF9F6]">
                    <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-[#1A1A1A] bg-white">
                      <FileText className="w-4 h-4 text-[#1A1A1A]" />
                      <span className="text-sm font-black text-[#1A1A1A] truncate">{file.path || file.name}</span>
                    </div>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-4 text-xs font-bold text-[#2D2D2D]">
                      {file.content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-[#FAF9F6] rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-6 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A]">
             <h3 className="text-lg font-black text-[#1A1A1A] mb-4">技能信息</h3>
             <div className="space-y-4">
               <div>
                 <p className="text-xs font-bold text-[#888] mb-1">开发者</p>
                 <p className="text-sm font-black text-[#1A1A1A] flex items-center">
                   <Users className="w-4 h-4 mr-2" />
                   {skill.author}
                 </p>
               </div>
               <div>
                 <p className="text-xs font-bold text-[#888] mb-1">文件数量</p>
                 <p className="text-sm font-black text-[#1A1A1A]">{skill.files?.length || 0}</p>
               </div>
               <div>
                 <p className="text-xs font-bold text-[#888] mb-1">发布状态</p>
                 <p className="text-sm font-black text-[#1A1A1A]">{skill.publishStatus}</p>
               </div>
               <div>
                 <p className="text-xs font-bold text-[#888] mb-1">运行环境限制</p>
                 {runtimeEnvironments.length > 0 ? (
                   <div className="flex flex-wrap gap-2 mt-1">
                     {runtimeEnvironments.map((runtime) => (
                       <span key={runtime} className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border-2 border-[#1A1A1A] bg-white">
                         {runtime}
                       </span>
                     ))}
                   </div>
                 ) : (
                   <p className="text-sm font-black text-[#1A1A1A]">无特殊限制</p>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
