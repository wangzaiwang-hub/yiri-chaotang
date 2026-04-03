import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

// 导入图片资源
import boyImage from '../recourse/boy.png';
import girlImage from '../recourse/girl.png';
import bgImage from '../recourse/bg.png';

export default function SelectGender() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 从 URL 参数获取 courtId
  const courtId = searchParams.get('courtId');

  useEffect(() => {
    // 如果没有 courtId，跳转到首页
    if (!courtId) {
      navigate('/');
    }
  }, [courtId, navigate]);

  const handleSubmit = async () => {
    if (!courtId) return;
    
    setIsSubmitting(true);
    try {
      await axios.patch(
        `/api/users/court-member/${courtId}/${user!.id}/gender`,
        { gender: selectedGender },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // 在 URL 中添加标记，表示刚刚完成性别选择
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
      <div className="max-w-2xl w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-4xl font-bold text-amber-900 mb-3">
            👑 选择你的身份
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            选择你在朝堂中的形象
          </p>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <button
              onClick={() => setSelectedGender('male')}
              className={`p-8 rounded-2xl border-4 transition-all transform hover:scale-105 ${
                selectedGender === 'male'
                  ? 'border-amber-600 bg-amber-50 shadow-xl'
                  : 'border-gray-200 hover:border-amber-300 bg-white'
              }`}
            >
              <img 
                src={boyImage} 
                alt="皇上" 
                className="w-48 h-48 mx-auto mb-4 object-contain"
              />
              <div className="font-bold text-2xl text-amber-900">皇上</div>
              <div className="text-sm text-gray-600 mt-2">男性形象</div>
            </button>

            <button
              onClick={() => setSelectedGender('female')}
              className={`p-8 rounded-2xl border-4 transition-all transform hover:scale-105 ${
                selectedGender === 'female'
                  ? 'border-pink-600 bg-pink-50 shadow-xl'
                  : 'border-gray-200 hover:border-pink-300 bg-white'
              }`}
            >
              <img 
                src={girlImage} 
                alt="皇后" 
                className="w-48 h-48 mx-auto mb-4 object-contain"
              />
              <div className="font-bold text-2xl text-pink-900">皇后</div>
              <div className="text-sm text-gray-600 mt-2">女性形象</div>
            </button>
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
