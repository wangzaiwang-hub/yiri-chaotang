import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Settings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // 加载用户的 API Key
    if (user) {
      axios.get(`/api/users/${user.id}`)
        .then(res => {
          if (res.data.secondme_api_key) {
            setApiKey(res.data.secondme_api_key);
          }
        })
        .catch(err => {
          console.error('Failed to load API key:', err);
        });
    }
  }, [user]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      showToast('请输入 API Key', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showToast('API Key 格式不正确，应该以 sk- 开头', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/api/users/${user!.id}`, {
        secondme_api_key: apiKey
      });
      showToast('保存成功！');
    } catch (error) {
      console.error('Failed to save API key:', error);
      showToast('保存失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-6">
      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-bold`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-amber-900">个人设置</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              返回
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SecondMe 虚拟人 API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-your-avatar-api-key"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-600">
                这个 API Key 用于让其他用户与你的虚拟人聊天。你可以在{' '}
                <a
                  href="https://second-me.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  SecondMe 开发者中心
                </a>
                {' '}获取。
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-lg disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
