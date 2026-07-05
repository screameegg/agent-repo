import React from 'react';
import { Link } from 'react-router-dom';
import { Agent } from '../../../../types';
import { motion } from 'motion/react';
import { Link as LinkIcon, Trash2 } from 'lucide-react';
import { resolveAgentAvatar } from '../../../../utils/image';
import { getAgentSkillStats } from '../../display';

interface AgentCardProps {
  agent: Agent;
  onDelete: (agent: Agent) => void;
}

export default function AgentCard({ agent, onDelete }: AgentCardProps) {
  const skillStats = getAgentSkillStats(agent);

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
      <Link to={`/app/agent/${agent.id}`} className="block group h-full">
        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] p-5 sm:p-6 shadow-[4px_4px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all duration-200 cursor-pointer h-full flex flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start space-x-4 min-w-0">
              <img src={resolveAgentAvatar(agent.avatar, agent.name)} alt={agent.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFD93D] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] p-1 object-cover shrink-0" />
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] truncate">{agent.name}</h3>
                <p className="text-xs font-bold text-[#888] mt-1.5 uppercase tracking-wide">{agent.role}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 shrink-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border-2 text-[10px] font-black ${
                agent.isAssociated
                  ? 'bg-[#E8F5E9] border-[#4CAF50] text-[#2E7D32]'
                  : 'bg-[#FFF3E0] border-[#FF9800] text-[#EF6C00]'
              }`}>
                <LinkIcon className="w-3 h-3 mr-1" />
                {agent.isAssociated ? '已关联' : '未关联'}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete(agent);
                }}
                className="p-1.5 bg-white border-2 border-[#FF6B6B] text-[#FF6B6B] rounded-lg hover:bg-[#FF6B6B] hover:text-white transition-colors"
                title="删除 Agent"
                aria-label={`删除 ${agent.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <p className="mt-5 text-sm font-medium text-[#2D2D2D] line-clamp-2 leading-relaxed flex-1">
            {agent.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 border-t-2 border-dashed border-[#E0E0E0]">
            <div className="flex items-center text-xs font-black text-[#1A1A1A]">
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-[#4CAF50] mr-2"></span>
              {skillStats.mountedLabel}
            </div>
            {skillStats.snapshotCount > 0 && (
              <div className="flex items-center text-xs font-black text-[#1A1A1A]">
                <span className="w-2.5 h-2.5 rounded-full border border-black bg-[#8EC5FF] mr-2"></span>
                {skillStats.snapshotLabel}
              </div>
            )}
            <div className="flex items-center text-xs font-black text-[#1A1A1A]">
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-[#FFD93D] mr-2"></span>
              {agent.memoryCount} 记忆
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
