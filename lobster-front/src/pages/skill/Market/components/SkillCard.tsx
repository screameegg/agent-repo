import React from 'react';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skill } from '../../../../types';

export default function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link to={`/app/market/${skill.id}`} className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-6 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all duration-200 flex flex-col h-full group relative overflow-hidden block">
      <div className="flex items-start justify-between space-x-4 mb-4 relative z-10">
        <div className="flex items-start space-x-4">
          <img src={skill.icon} alt={skill.name} className="w-14 h-14 rounded-2xl bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] p-2 object-contain" />
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] truncate max-w-[150px]">{skill.name}</h3>
            <p className="text-xs font-bold text-[#888] mt-1.5 uppercase tracking-wide">by {skill.author}</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <p className="text-sm font-medium text-[#2D2D2D] line-clamp-2 leading-relaxed flex-1 relative z-10">
        {skill.description}
      </p>

      <div className="mt-6 flex items-center justify-between pt-5 border-t-2 border-dashed border-[#E0E0E0] relative z-10">
        <div className="flex items-center text-xs font-black text-[#1A1A1A]">
          <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
          {(skill.installs / 1000).toFixed(1)}k 安装
        </div>
        <span className="text-[10px] font-bold text-[#888] group-hover:text-[#1A1A1A] underline underline-offset-2">查看详情</span>
      </div>
    </Link>
  );
}
