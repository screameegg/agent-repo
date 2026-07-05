import React, { useState } from 'react';
import { Bot, Sparkles, Code2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { useLogin } from './hooks/useLogin';

export default function Login() {
  const { handleLogin, handleRegister, loading, error } = useLogin();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col lg:flex-row selection:bg-[#FFD93D] selection:text-[#1A1A1A] lg:overflow-hidden">
      
      {/* Left side: Intro & Interactive Effects */}
      <div className="lg:w-[50%] lg:h-screen p-6 sm:p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden bg-[#FFD93D] lg:border-r-[4px] border-b-[4px] lg:border-b-0 border-[#1A1A1A]">
        
        {/* Interactive floating elements */}
        <motion.div 
          className="hidden sm:flex absolute top-[20%] left-[15%] w-16 h-16 bg-white border-4 border-[#1A1A1A] rounded-2xl items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A]"
          animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-8 h-8 text-[#1A1A1A]" />
        </motion.div>
        
        <motion.div 
          className="hidden sm:flex absolute top-[60%] right-[10%] w-20 h-20 bg-[#FF6B6B] border-4 border-[#1A1A1A] rounded-full items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A]"
          animate={{ y: [0, -20, 0], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <Code2 className="w-10 h-10 text-white" />
        </motion.div>
        
        <motion.div 
          className="hidden sm:flex absolute bottom-[20%] left-[25%] w-24 h-24 bg-[#A5D6A7] border-4 border-[#1A1A1A] rounded-[32px] items-center justify-center shadow-[4px_4px_0px_0px_#1A1A1A]"
          animate={{ y: [0, -25, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Cpu className="w-12 h-12 text-[#1A1A1A]" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl text-center lg:text-left mx-auto lg:mx-0 py-8 lg:py-0">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-white border-4 border-[#1A1A1A] rounded-[24px] sm:rounded-[28px] flex items-center justify-center shadow-[5px_5px_0px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_0px_#1A1A1A] mb-6 sm:mb-8 mx-auto lg:mx-0"
          >
            <Bot className="w-12 h-12 text-[#1A1A1A]" />
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1A1A1A] leading-tight"
          >
            知栈
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 sm:mt-6 text-lg sm:text-xl lg:text-2xl font-bold text-[#1A1A1A] uppercase tracking-wide"
          >
            智能能力集线器
          </motion.p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 sm:mt-8 text-sm sm:text-base font-bold text-[#444] max-w-md mx-auto lg:mx-0 bg-white/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_0px_#1A1A1A] backdrop-blur-sm"
          >
            欢迎使用知栈，一站式管理、编排与分发您的智能体能力。连接您的数据，编写自定义技能，并将 AI 无缝集成到您的应用生态中。
          </motion.div>
        </div>
      </div>

      {/* Right side: Login / Register Form */}
      <div className="lg:w-[50%] flex flex-col justify-center items-center py-10 sm:py-16 px-4 sm:px-6 lg:px-16 bg-[#FAF9F6]">
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-full max-w-[440px] z-10"
        >
          <div className="bg-white border-[3px] sm:border-[4px] border-[#1A1A1A] rounded-[24px] sm:rounded-[32px] shadow-[5px_5px_0px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_0px_#1A1A1A] overflow-hidden">
            
            <div className="flex border-b-[4px] border-[#1A1A1A]">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-4 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-wider transition-colors ${
                  mode === 'login' ? 'bg-[#1A1A1A] text-white' : 'bg-[#FAF9F6] text-[#888] hover:bg-white hover:text-[#1A1A1A]'
                }`}
              >
                登录账户
              </button>
              <div className="w-[4px] bg-[#1A1A1A]"></div>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-4 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-wider transition-colors ${
                  mode === 'register' ? 'bg-[#1A1A1A] text-white' : 'bg-[#FAF9F6] text-[#888] hover:bg-white hover:text-[#1A1A1A]'
                }`}
              >
                注册新账号
              </button>
            </div>

            <div className="p-5 sm:p-8 lg:p-10 relative overflow-hidden bg-white">
              <AnimatePresence mode="wait">
                {mode === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <RegisterForm onSubmit={handleRegister} loading={loading} error={error} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
