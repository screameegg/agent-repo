import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RegisterFormData } from '../types';
import { Loader2, RefreshCw } from 'lucide-react';
import { getCaptchaApi } from '../service';
import {
  captchaFieldRowClassName,
  captchaImageButtonClassName,
  captchaImageClassName,
  captchaInputClassName,
} from '../captchaStyles';

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export default function RegisterForm({ onSubmit, loading, error }: RegisterFormProps) {
  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm<RegisterFormData>();
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const password = watch('password');

  const refreshCaptcha = async () => {
    const username = getValues('username')?.trim();
    if (!username) {
      setCaptchaError('请先输入用户名');
      return;
    }

    try {
      setCaptchaLoading(true);
      setCaptchaError(null);
      const res = await getCaptchaApi({ account: username, type: 'register' });
      if (res.code === 200) {
        setCaptchaKey(res.data.captchaKey);
        setCaptchaImage(res.data.captchaImage);
      } else {
        setCaptchaError(res.message || '验证码加载失败');
      }
    } catch {
      setCaptchaError('验证码加载失败');
    } finally {
      setCaptchaLoading(false);
    }
  };

  const submitForm = async (data: RegisterFormData) => {
    const success = await onSubmit({ ...data, captchaKey });
    if (!success) {
      await refreshCaptcha();
    }
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-5">
      <div>
        <label className="block text-[11px] font-black text-[#1A1A1A] mb-2 uppercase tracking-widest">Username</label>
        <input
          {...register('username', { required: '用户名必填', minLength: { value: 3, message: '最短3位' } })}
          className="block w-full px-4 py-3 bg-[#F5F5F5] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A1A] placeholder-[#888] outline-none focus:bg-white focus:translate-y-0.5 focus:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
          placeholder="admin"
          onBlur={() => {
            if (!captchaImage && !captchaLoading) {
              void refreshCaptcha();
            }
          }}
        />
        {errors.username && <p className="mt-2 text-xs font-bold text-[#FF6B6B]">{errors.username.message}</p>}
      </div>

      <div>
        <label className="block text-[11px] font-black text-[#1A1A1A] mb-2 uppercase tracking-widest">Password</label>
        <input
          type="password"
          {...register('password', { required: '密码必填', minLength: { value: 6, message: '最短6位' } })}
          className="block w-full px-4 py-3 bg-[#F5F5F5] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A1A] placeholder-[#888] outline-none focus:bg-white focus:translate-y-0.5 focus:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
          placeholder="••••••"
        />
        {errors.password && <p className="mt-2 text-xs font-bold text-[#FF6B6B]">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-[11px] font-black text-[#1A1A1A] mb-2 uppercase tracking-widest">Confirm Password</label>
        <input
          type="password"
          {...register('confirmPassword', { 
            required: '请确认密码', 
            validate: value => value === password || '两次密码不一致' 
          })}
          className="block w-full px-4 py-3 bg-[#F5F5F5] border-2 border-[#1A1A1A] rounded-xl text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A1A] placeholder-[#888] outline-none focus:bg-white focus:translate-y-0.5 focus:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
          placeholder="••••••"
        />
        {errors.confirmPassword && <p className="mt-2 text-xs font-bold text-[#FF6B6B]">{errors.confirmPassword.message}</p>}
      </div>

      <div>
        <label className="block text-[11px] font-black text-[#1A1A1A] mb-2 uppercase tracking-widest">Captcha</label>
        <div className={captchaFieldRowClassName}>
          <input
            {...register('captcha', { required: '请输入验证码' })}
            className={captchaInputClassName}
            placeholder="验证码"
          />
          <button
            type="button"
            className={captchaImageButtonClassName}
            onClick={() => void refreshCaptcha()}
            disabled={captchaLoading}
            aria-label="刷新验证码"
          >
            {captchaImage ? (
              <img src={captchaImage} alt="captcha" className={captchaImageClassName} />
            ) : (
              <RefreshCw className={`w-5 h-5 text-[#1A1A1A] ${captchaLoading ? 'animate-spin' : ''}`} />
            )}
            {captchaImage && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <RefreshCw className="w-5 h-5 text-[#1A1A1A]" />
              </div>
            )}
          </button>
        </div>
        {errors.captcha && <p className="mt-2 text-xs font-bold text-[#FF6B6B]">{errors.captcha.message}</p>}
        {captchaError && <p className="mt-2 text-xs font-bold text-[#FF6B6B]">{captchaError}</p>}
      </div>

      {error && <div className="p-3 text-xs font-black text-white bg-[#FF6B6B] border-2 border-[#1A1A1A] rounded-xl shadow-[2px_2px_0px_0px_#1A1A1A] tracking-wide">{error}</div>}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || captchaLoading}
          className="w-full flex justify-center items-center py-3.5 px-4 border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_0px_#1A1A1A] text-[15px] font-black bg-[#FFD93D] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-0 active:shadow-[0px_0px_0px_0px_#1A1A1A] text-[#1A1A1A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#1A1A1A]" /> : <span>注册并进入系统</span>}
        </button>
      </div>
    </form>
  );
}
