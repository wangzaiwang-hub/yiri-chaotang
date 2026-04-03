import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 如果已经登录，直接跳转到首页
    if (isAuthenticated && !searchParams.get('token')) {
      navigate('/');
      return;
    }

    const token = searchParams.get('token');
    const userId = searchParams.get('user_id');

    if (token && userId && !isProcessing) {
      setIsProcessing(true);
      setError(null);
      
      // 先临时保存 token，这样 API 请求才能带上 Authorization header
      useAuthStore.setState({ token });
      
      // 获取用户信息
      authAPI.getMe()
        .then((res) => {
          console.log('User info received:', res.data);
          setAuth(res.data, token);
          navigate('/');
        })
        .catch((error) => {
          console.error('Failed to get user info:', error);
          setError('登录失败，请重试');
          // 清除无效的 token
          useAuthStore.setState({ token: null, user: null });
          setIsProcessing(false);
        });
    }
  }, [searchParams, setAuth, navigate, isAuthenticated, isProcessing]);

  const handleLogin = () => {
    // 传递当前的 frontend URL，这样回调时可以重定向回正确的地址
    const frontendUrl = window.location.origin;
    window.location.href = `/api/auth/secondme/login?frontend_url=${encodeURIComponent(frontendUrl)}`;
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            </div>
            <p className="text-gray-600">正在登录中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-amber-900 mb-2">
              👑 朝堂
            </h1>
            <p className="text-2xl text-amber-700 font-medium">一日帝王</p>
          </div>

          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              兄弟，好友，闺蜜，死党之间一起玩的模拟朝堂游戏
            </p>
            <div className="bg-amber-50 rounded-lg p-4 text-sm text-gray-700">
              <p className="mb-2">🎮 纯虚拟分身的AI权力游戏</p>
              <p className="mb-2">👑 今天你是皇帝，明天换他当</p>
              <p>😤 谁虚拟干活最多，谁怨气最重，第二天就让你当皇帝</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            使用 SecondMe 登录
          </button>

          <p className="mt-6 text-xs text-gray-500">
            登录即表示同意使用 SecondMe 虚拟分身服务
          </p>
        </div>
      </div>
    </div>
  );
}
