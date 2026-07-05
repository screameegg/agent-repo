import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  data?: any;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string, data?: any) => void;
  placeholder?: string;
}

export default function CustomSelect({ options, value, onChange, placeholder = "-- 请选择 --" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groups = options.reduce((acc, option) => {
    const groupName = option.group || 'default';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(option);
    return acc;
  }, {} as Record<string, SelectOption[]>);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded-xl text-[#1A1A1A] font-black outline-none transition-all focus:bg-white hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A]"
      >
        <span className="truncate">{selectedOption && value !== 'none' ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_0px_#1A1A1A] max-h-64 overflow-y-auto z-50 custom-scrollbar p-2"
          >
            {Object.entries(groups).map(([group, opts]) => (
              <div key={group} className="mb-2 last:mb-0">
                {group !== 'default' && (
                  <div className="px-3 py-2 text-[10px] font-black text-[#888] tracking-widest uppercase">
                    {group}
                  </div>
                )}
                <div className="space-y-1">
                  {opts.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value, option.data);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-black flex items-center justify-between transition-colors rounded-lg border-2 border-transparent ${
                        value === option.value 
                          ? 'bg-[#FFD93D] text-[#1A1A1A] border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]' 
                          : 'text-[#555] hover:bg-[#FAF9F6] hover:text-[#1A1A1A] hover:border-[#1A1A1A]'
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {value === option.value && <Check className="w-5 h-5 text-[#1A1A1A]" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
