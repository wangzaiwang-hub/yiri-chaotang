import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

import boyImage from '../recourse/boy.png';
import girlImage from '../recourse/girl.png';
import bgImage from '../recourse/bg.png';

const API_BASE = 'https://backend-production-a216.up.railway.app';

export default function SelectGender() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const courtId = searchParams.get('courtId');

  useEffect(() => {
    if (!courtId) {
      navigate('/');
    }
  }, [courtId, navigate]);

  const handleSubmit = async () => {
    if (!courtId) return;
    
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/users/court-member/${courtId}/${user!.id}/gender`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ gender: selectedGender }),
      });
      
      navigate(`/?gender_updated=true`, { replace: true });
    } catch (error) {
      console.error('更新性别失败:', error);
      alert('更新失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-3 text-center">
            重生转世
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            选择你在朝堂中的形象
          </p>

          <div className="mb-6">
            <label className="block text-amber-900 font-bold mb-3 text-lg">
              选择性别
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value as 'male' | 'female')}
              className="w-full px-4 py-3 text-lg border-2 border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white text-amber-900 font-medium"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23b45309'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
                appearance: 'none',
              }}
            >
              <option value="male">皇上（男性形象）</option>
              <option value="female">皇后（女性形象）</option>
            </select>
          </div>

          <div className="mb-6 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
            <div className="flex items-center justify-center">
              <img 
                src={selectedGender === 'male' ? boyImage : girlImage}
                alt={selectedGender === 'male' ? '皇上' : '皇后'}
                className="w-32 h-32 object-contain"
              />
            </div>
            <div className="text-center mt-3">
              <div className="font-bold text-xl text-amber-900">
                {selectedGender === 'male' ? '皇上' : '皇后'}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedGender === 'male' ? '男性形象' : '女性形象'}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 text-lg"
          >
            {isSubmitting ? '保存中...' : '确认选择'}
          </button>
        </div>
      </div>
    </div>
  );
}
