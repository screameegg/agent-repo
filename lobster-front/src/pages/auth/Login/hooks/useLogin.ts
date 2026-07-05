import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../../../store/userStore';
import { loginApi, registerApi } from '../service';
import { LoginFormData, LoginResponse, RegisterFormData } from '../types';
import logger from '../../../../utils/logger';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUser } = useUserStore();

  const persistAuthAndNavigate = (data: LoginResponse) => {
    setToken(data.token);
    setUser(data.user);
    const from = location.state?.from?.pathname || '/app';
    navigate(from, { replace: true });
  };

  const handleLogin = async (data: LoginFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await loginApi(data);
      if (res.code === 200) {
        persistAuthAndNavigate(res.data);
        return true;
      } else {
        setError(res.message || '登录失败');
        return false;
      }
    } catch (err) {
      logger.error('Login error:', err);
      setError('系统异常，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await registerApi(data);
      if (res.code === 200) {
        persistAuthAndNavigate(res.data);
        return true;
      } else {
        setError(res.message || '注册失败');
        return false;
      }
    } catch (err) {
      logger.error('Register error:', err);
      setError('系统异常，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, handleRegister, loading, error };
};
