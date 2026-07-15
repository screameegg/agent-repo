import React from 'react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Bot, ArrowRight, Sparkles, Code2, Cpu, Blocks, Webhook, Box, Lock, LayoutGrid, ZapIcon, Copy, CheckCircle2, FileCode2, MessagesSquare, Wand2, Github, BookOpen } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { writeClipboardText } from '../../utils/clipboard';
import { buildSkillCopyPrompt } from './skillCopyPrompt';
import { quickEntryLinks } from '../../components/Layout/quickLinks';

export default function Landing() {
  const { token } = useUserStore();
  const [copiedSkillPrompt, setCopiedSkillPrompt] = useState(false);

  // If already logged in, redirect to /app
  if (token) {
    return <Navigate to="/app" replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };
  const frontendOrigin = typeof window === 'undefined' ? '' : window.location.origin;
  const skillCopyPrompt = buildSkillCopyPrompt({ frontendOrigin });

  const handleCopySkillPrompt = async () => {
    await writeClipboardText(skillCopyPrompt);
    setCopiedSkillPrompt(true);
    window.setTimeout(() => setCopiedSkillPrompt(false), 2000);
  };

  const quickEntryIcons = {
    github: <Github className="w-4 h-4" />,
    tutorial: <BookOpen className="w-4 h-4" />,
  } as const;

  return (
    <div className="min-h-screen bg-[#FAF9F6] selection:bg-[#FFD93D] selection:text-[#1A1A1A] font-sans">
      
      {/* Background Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.04] z-0" 
        style={{ 
          backgroundImage: 'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)', 
          backgroundSize: '32px 32px' 
        }}
      ></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 px-6 md:px-12 py-5 flex items-center justify-between z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b-4 border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD93D] border-[3px] border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#1A1A1A]">
            <Bot className="w-6 h-6 text-[#1A1A1A]" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-[#1A1A1A]">知栈</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2">
            {quickEntryLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target={link.target}
                rel={link.rel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#1A1A1A] font-black text-sm rounded-xl border-4 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all"
              >
                {quickEntryIcons[link.id]}
                {link.label}
              </a>
            ))}
          </div>
          <Link 
            to="/login"
            className="px-6 py-2.5 bg-white text-[#1A1A1A] font-black text-sm rounded-xl border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all hidden md:block"
          >
            登录账户
          </Link>
          <Link 
            to="/login"
            className="px-6 py-2.5 bg-[#FFD93D] text-[#1A1A1A] font-black text-sm rounded-xl border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all flex items-center gap-2"
          >
            无缝接入 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 text-center pt-24 pb-20 overflow-hidden z-10">
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate="show"
           className="max-w-5xl mx-auto relative z-20"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-4 border-[#1A1A1A] bg-white text-xs md:text-sm font-black uppercase tracking-widest mb-10 shadow-[4px_4px_0px_0px_#1A1A1A]">
              <Sparkles className="w-5 h-5 text-[#FF6B6B]" />
              企业级 AI Agent 编排平台
            </div>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-[6.5rem] font-black text-[#1A1A1A] tracking-tighter leading-[1.1] mb-8 relative">
            构建与连接<br/>
            <span className="relative inline-block mt-4 md:mt-6">
              <span className="relative z-10">你的 AI 大脑</span>
              <span className="absolute bottom-1 left-[-2%] w-[104%] h-[40%] bg-[#FFD93D] -z-10 -rotate-2 border-2 border-[#1A1A1A]"></span>
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-2xl font-bold text-[#555] mb-12 max-w-3xl mx-auto leading-relaxed">
            极速装配百款技能，串联各种 LLM 模型，让复杂的业务流像搭积木一样简单，打造完全自主的超级智能体。
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link 
              to="/login"
              className="inline-flex items-center gap-4 px-10 py-5 bg-[#FF6B6B] text-white font-black text-xl rounded-2xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_#1A1A1A] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all group"
            >
              🚀 即刻开启构建 
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:hidden">
              {quickEntryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.target}
                  rel={link.rel}
                  className="inline-flex min-h-11 items-center gap-2 px-4 py-2 bg-white text-[#1A1A1A] font-black text-sm rounded-xl border-4 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] hover:-translate-y-1 transition-all"
                >
                  {quickEntryIcons[link.id]}
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative Floating Elements */}
        <motion.div 
           animate={{ y: [0, -30, 0], rotate: [0, 10, -10, 0] }}
           transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[20%] left-[8%] hidden lg:flex w-24 h-24 bg-[#FFD93D] border-4 border-[#1A1A1A] rounded-[2rem] items-center justify-center shadow-[6px_6px_0px_0px_#1A1A1A]"
        >
          <Box className="w-12 h-12 text-[#1A1A1A]" />
        </motion.div>
        
        <motion.div 
           animate={{ y: [0, 25, 0], rotate: [0, -15, 10, 0] }}
           transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
           className="absolute top-[40%] right-[8%] hidden lg:flex w-24 h-24 bg-[#A5D6A7] border-4 border-[#1A1A1A] rounded-full items-center justify-center shadow-[6px_6px_0px_0px_#1A1A1A]"
        >
          <Webhook className="w-12 h-12 text-[#1A1A1A]" />
        </motion.div>

        <motion.div 
           animate={{ y: [0, -20, 0], rotate: [0, -5, 5, 0] }}
           transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
           className="absolute bottom-[20%] left-[18%] hidden lg:flex w-20 h-20 bg-white border-4 border-[#1A1A1A] rounded-xl items-center justify-center shadow-[6px_6px_0px_0px_#1A1A1A]"
        >
          <Code2 className="w-10 h-10 text-[#FF6B6B]" />
        </motion.div>
      </section>

      {/* Bento Grid Features Section */}
      <section className="relative z-20 py-24 px-6 md:px-12 bg-[#FFD93D] border-t-4 border-[#1A1A1A] overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white opacity-20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-[#1A1A1A] tracking-tighter mb-6">
              为开发者打造的 <span className="text-white drop-shadow-[2px_2px_0px_#1A1A1A] stroke-black">智能引擎</span>
            </h2>
            <p className="text-xl text-[#1A1A1A] font-bold max-w-2xl mx-auto">
              摆脱繁杂的集成与鉴权，专注核心业务的创新
            </p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6"
          >
            {/* Bento Box 1 - large */}
            <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-4 bg-white rounded-[2rem] border-4 border-[#1A1A1A] p-10 shadow-[8px_8px_0px_0px_#1A1A1A] hover:shadow-[12px_12px_0px_0px_#1A1A1A] transition-all group">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                 <Blocks className="w-8 h-8 text-[#FFD93D] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-3xl font-black text-[#1A1A1A] mb-4">无限拓展的统一技能市场</h3>
              <p className="text-lg text-[#666] font-bold max-w-md">包含网页爬虫、文档分析、搜索、图表生成等百余种原子技能，支持自由组合。同时提供简便的插件 SDK，您可以极速注册私有业务 API 进入工具箱。</p>
            </motion.div>

            {/* Bento Box 2 */}
            <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-2 bg-[#FF6B6B] rounded-[2rem] border-4 border-[#1A1A1A] p-10 shadow-[8px_8px_0px_0px_#1A1A1A] hover:shadow-[12px_12px_0px_0px_#1A1A1A] transition-all group flex flex-col justify-between">
              <div className="w-16 h-16 bg-white border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-2xl flex items-center justify-center mb-6">
                 <Cpu className="w-8 h-8 text-[#1A1A1A] group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">多模型自由调度</h3>
                <p className="text-white/90 font-bold">内置主流大模型接口，可视化切换与对比，为合适的任务挑选合适的模型与成本。</p>
              </div>
            </motion.div>

            {/* Bento Box 3 */}
            <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3 bg-[#A5D6A7] rounded-[2rem] border-4 border-[#1A1A1A] p-10 shadow-[8px_8px_0px_0px_#1A1A1A] hover:shadow-[12px_12px_0px_0px_#1A1A1A] transition-all group h-[280px]">
              <div className="w-14 h-14 bg-white border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-2xl flex items-center justify-center mb-6">
                 <ZapIcon className="w-6 h-6 text-[#1A1A1A] group-hover:-translate-y-1 transition-transform" />
              </div>
              <h3 className="text-2xl font-black text-[#1A1A1A] mb-3">极致性能底座</h3>
              <p className="text-[#1A1A1A] font-bold">支持全流式传输与并行工具调用，打造毫秒级低延迟推断，确保给您的系统带来极佳的用户体验。</p>
            </motion.div>

            {/* Bento Box 4 */}
            <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3 bg-white rounded-[2rem] border-4 border-[#1A1A1A] p-10 shadow-[8px_8px_0px_0px_#1A1A1A] hover:shadow-[12px_12px_0px_0px_#1A1A1A] transition-all group h-[280px]">
              <div className="w-14 h-14 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-6">
                 <Lock className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-black text-[#1A1A1A] mb-3">企业级数据隔离</h3>
              <p className="text-[#666] font-bold">独立的租户与权限体系，所有敏感密钥加密存储到本地，确保业务流逻辑的安全性与私密性。</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Skill to AI Section */}
      <section className="relative z-20 py-20 sm:py-24 px-4 sm:px-6 md:px-12 bg-[#FAF9F6] border-t-4 border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-10 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="bg-white border-4 border-[#1A1A1A] rounded-[2rem] p-6 sm:p-8 shadow-[8px_8px_0px_0px_#1A1A1A]"
          >
            <div className="w-14 h-14 bg-[#FFD93D] border-4 border-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A] mb-6">
              <MessagesSquare className="w-7 h-7 text-[#1A1A1A]" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight leading-tight mb-5">
              复制 Skill 给 AI，直接让它学会怎么用
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#555] leading-relaxed mb-8">
              不需要重新解释工具背景。把 Skill 的说明、配置和文件树交给 AI，它会按约束读取能力边界、参数格式和调用流程，再同步回 Agent。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ['1', '复制 Skill 文件'],
                ['2', '交给 AI 阅读'],
                ['3', '同步回 Agent'],
              ].map(([step, label]) => (
                <div key={step} className="bg-[#FDFCFB] border-2 border-[#1A1A1A] rounded-2xl p-4">
                  <span className="inline-flex w-8 h-8 items-center justify-center bg-[#FF6B6B] text-white border-2 border-[#1A1A1A] rounded-lg font-black text-sm mb-3">{step}</span>
                  <p className="text-sm font-black text-[#1A1A1A]">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.08 }}
            className="bg-[#1A1A1A] border-4 border-[#1A1A1A] rounded-[2rem] p-4 sm:p-6 shadow-[8px_8px_0px_0px_#FFD93D] flex flex-col min-h-[32rem]"
          >
            <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-white/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-white border-2 border-[#1A1A1A] rounded-xl flex items-center justify-center shrink-0">
                  <FileCode2 className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-black text-sm sm:text-base truncate">Skill Handoff Prompt</p>
                  <p className="text-white/60 text-xs font-bold">复制后贴给任意 AI 助手</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopySkillPrompt}
                className="min-h-10 inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#FFD93D] text-[#1A1A1A] border-2 border-white rounded-xl font-black text-xs sm:text-sm hover:-translate-y-0.5 transition-all shrink-0"
              >
                {copiedSkillPrompt ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedSkillPrompt ? '已复制' : '复制'}
              </button>
            </div>

            <pre className="mt-5 flex-1 overflow-hidden whitespace-pre-wrap break-words rounded-2xl bg-[#0F0F0F] border-2 border-white/20 p-4 text-left text-xs sm:text-sm leading-relaxed text-[#F7F7F7] font-mono">
{`请把这个 Skill 接入我的 AI 工作流。

1. 先读取 SKILL.md / README / manifest。
2. 理解输入输出、权限、限制和失败处理。
3. 执行任务时只使用 Skill 明确声明的能力。
4. 如果需要同步到知栈 Agent，在 configJson 里带稳定 code。

示例：
{
  "sourceType": "custom",
  "configJson": "{\\"code\\":\\"repository-reader\\"}"
}`}
            </pre>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-white/10 border-2 border-white/20 rounded-2xl p-3">
                <Wand2 className="w-5 h-5 text-[#FFD93D] shrink-0" />
                <p className="text-xs font-bold text-white/80">AI 先读说明，再决定怎么调用。</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 border-2 border-white/20 rounded-2xl p-3">
                <Sparkles className="w-5 h-5 text-[#FFD93D] shrink-0" />
                <p className="text-xs font-bold text-white/80">同一个 code 可同步为 Agent 挂载。</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 bg-white border-t-4 border-[#1A1A1A]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto bg-[#FFD93D] border-4 border-[#1A1A1A] rounded-[2rem] flex items-center justify-center shadow-[6px_6px_0px_0px_#1A1A1A] mb-8">
            <LayoutGrid className="w-12 h-12 text-[#1A1A1A]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-6 tracking-tight">准备好定义未来应用了吗？</h2>
          <p className="text-xl font-bold text-[#666] mb-12">
            花三分钟注册，组装真正能在业务场景中落地的智能体。
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center gap-3 px-12 py-5 bg-[#1A1A1A] text-white font-black text-xl rounded-2xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_#1A1A1A] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] transition-all"
          >
            免费体验 <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12 px-6 md:px-12 border-t-4 border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFD93D] border-[3px] border-[#1A1A1A] rounded-xl flex items-center justify-center">
              <Bot className="w-7 h-7 text-[#1A1A1A]" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">知栈</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 text-gray-400 font-bold">
            <span>© {new Date().getFullYear()} 知栈.</span>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              豫ICP备2026030627号-1
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
