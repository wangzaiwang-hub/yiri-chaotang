import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const frontendUrl = searchParams.get('frontend_url');

      if (code && state) {
        try {
          const response = await api.get(`/auth/callback?code=${code}&state=${state}`);
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          navigate('/');
        } catch (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
        }
      } else if (frontendUrl) {
        window.location.href = frontendUrl;
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-900 to-amber-700">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">👑</div>
        <p className="text-amber-100 text-xl">正在处理登录...</p>
      </div>
    </div>
  );
}
