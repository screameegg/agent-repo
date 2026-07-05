import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import SkillCard from './components/SkillCard';
import { Skill } from '../../../types';
import { motion } from 'motion/react';
import { pageMarketSkillsApi } from '../service';
import { resolveSkillIcon } from '../../../utils/image';

export default function SkillMarket() {
  const [search, setSearch] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSkills = async () => {
      setIsLoading(true);
      try {
        const response = await pageMarketSkillsApi({ current: 1, size: 50, keyword: search || undefined });
        if (response.code === 200) {
          setSkills(response.data.records.map((skill) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            author: skill.author,
            installs: skill.installCount || 0,
            icon: resolveSkillIcon(skill.icon, skill.name),
            version: skill.version,
            visibility: skill.visibility,
            publishStatus: skill.publishStatus,
            runtimeEnvironments: skill.runtimeEnvironments || [],
            coreCapabilities: skill.coreCapabilities || [],
          })));
        }
      } finally {
        setIsLoading(false);
      }
    };
    const timer = window.setTimeout(loadSkills, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#1A1A1A] pb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">技能市场</h2>
          <p className="text-[#888] font-bold text-sm mt-1">发现并安装各种通用 Agent 结构化技能</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
          <input 
            type="text" 
            placeholder="搜索您需要的技能..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#F5F5F5] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold shadow-[3px_3px_0px_0px_#1A1A1A] focus:outline-none focus:bg-white focus:translate-y-0.5 focus:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
        {skills.map((skill, index) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SkillCard skill={skill} />
          </motion.div>
        ))}
      </div>

      {!isLoading && skills.length === 0 && (
        <div className="bg-[#FAF9F6] rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-8 sm:p-12 text-center shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A]">
          <h3 className="text-xl font-black text-[#1A1A1A]">暂无公开技能</h3>
          <p className="text-sm font-bold text-[#888] mt-2">发布一个 Skill 后，它会出现在这里供其他用户安装。</p>
        </div>
      )}
    </motion.div>
  );
}
