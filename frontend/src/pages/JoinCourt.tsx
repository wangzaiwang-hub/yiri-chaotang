import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { courtAPI } from '../services/api';

// 导入背景视频
import inviteBgVideo from '../recourse/invite_bg.mp4';

const DEPARTMENTS = [
  { id: 'zhongshu', name: '中书省', desc: '规划任务、拆解方案' },
  { id: 'menxia', name: '门下省', desc: '审核方案、封驳打回' },
  { id: 'shangshu', name: '尚书省', desc: '派发任务、协调汇总' },
  { id: 'hubu', name: '户部', desc: '数据处理、报表生成' },
  { id: 'libu', name: '礼部', desc: '文档撰写、规范制定' },
  { id: 'bingbu', name: '兵部', desc: '代码开发、算法实现' },
  { id: 'xingbu', name: '刑部', desc: '安全审计、合规检查' },
  { id: 'gongbu', name: '工部', desc: '部署运维、基础设施' },
  { id: 'libu_hr', name: '吏部', desc: '人事管理、成员协调' },
];

export default function JoinCourt() {
  const { courtId } = useParams<{ courtId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [court, setCourt] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Toast 提示函数
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    console.log('=== 加入朝堂调试信息 ===');
    console.log('朝堂ID:', courtId);
    console.log('当前用户:', user);
    console.log('是否已登录:', isAuthenticated);
    
    if (!isAuthenticated) {
      // 未登录，跳转到登录页
      console.log('未登录，跳转到登录页');
      navigate('/login');
      return;
    }

    // 获取朝堂信息
    courtAPI.get(courtId!)
      .then((res) => {
        console.log('获取到朝堂信息:', res.data);
        if (!res.data || !res.data.data) {
          setError('朝堂不存在或已被删除');
          return;
        }
        setCourt(res.data.data);
      })
      .catch((err) => {
        console.error('获取朝堂信息失败:', err);
        setError('朝堂不存在或已被删除');
      });
  }, [courtId, isAuthenticated, navigate, user]);

  const handleJoin = async () => {
    if (!selectedDepartment) {
      setError('请选择你要加入的部门');
      return;
    }

    console.log('=== 开始加入朝堂 ===');
    console.log('朝堂ID:', courtId);
    console.log('用户ID:', user!.id);
    console.log('选择的部门:', selectedDepartment);

    setIsJoining(true);
    setError('');

    try {
      const result = await courtAPI.invite(courtId!, user!.id, selectedDepartment);
      console.log('加入成功，返回结果:', result);
      showToast('加入成功！你现在是这个朝堂的大臣了');
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      console.error('加入朝堂失败:', err);
      console.error('错误详情:', err.response?.data);
      if (err.response?.data?.error?.includes('duplicate')) {
        setError('你已经是这个朝堂的成员了');
      } else {
        setError(`加入失败：${err.response?.data?.error || '请重试'}`);
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (!court) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* 背景视频 */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: -1 }}
        >
          <source src={inviteBgVideo} type="video/mp4" />
        </video>
        
        <div className="relative text-center" style={{ zIndex: 1 }}>
          {error ? (
            <div className="p-12 max-w-md mx-auto animate-scaleIn">
              <h2 className="text-3xl font-bold text-red-300 mb-6 text-chinese-title" style={{ textShadow: '0 0 20px rgba(252, 165, 165, 0.8), 0 4px 12px rgba(0,0,0,0.9)' }}>朝堂不存在</h2>
              <p className="text-red-100 mb-8 text-chinese-elegant text-xl" style={{ textShadow: '0 0 10px rgba(252, 165, 165, 0.5), 0 2px 8px rgba(0,0,0,0.9)' }}>{error}</p>
              <button
                onClick={() => navigate('/')}
                className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-2xl transition-all transform hover:scale-105 text-chinese-elegant text-xl border-2 border-amber-300"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                返回首页
              </button>
            </div>
          ) : (
            <div className="p-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-400 mx-auto mb-6 shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.6))' }}></div>
              <p className="text-amber-200 text-xl text-chinese-elegant" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.6), 0 2px 8px rgba(0,0,0,0.9)' }}>加载中...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* 背景视频 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: -1 }}
      >
        <source src={inviteBgVideo} type="video/mp4" />
      </video>
      
      {/* Toast 提示 - 游戏风格 */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-8 py-4 rounded-2xl shadow-2xl transition-all duration-500 animate-scaleIn border-4 ${
          toast.type === 'success' 
            ? 'bg-gradient-to-r from-green-400 to-green-500 border-green-600 text-green-900' 
            : 'bg-gradient-to-r from-red-400 to-red-500 border-red-600 text-red-900'
        } font-bold text-lg text-chinese-elegant bg-opacity-95`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {toast.type === 'success' ? '✓' : '✗'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="relative max-w-3xl w-full animate-fadeInUp" style={{ zIndex: 1 }}>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-amber-300 mb-3 text-chinese-title" style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 4px 12px rgba(0,0,0,0.9)' }}>
            加入朝堂
          </h1>
          <p className="text-amber-100 text-xl text-chinese-elegant" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5), 0 2px 8px rgba(0,0,0,0.9)' }}>你收到了一个朝堂邀请</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-amber-200 mb-3 text-chinese-title" style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 4px 12px rgba(0,0,0,0.9)' }}>
            {court.name}
          </h2>
          {court.description && (
            <p className="text-amber-50 mb-4 text-chinese-elegant text-xl leading-relaxed" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5), 0 2px 8px rgba(0,0,0,0.9)' }}>{court.description}</p>
          )}
          <div className="flex items-center justify-center gap-2 text-amber-100 text-chinese-elegant text-lg" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5), 0 2px 8px rgba(0,0,0,0.9)' }}>
            <span>创建者：{court.creator?.nickname}</span>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-amber-300 mb-6 text-chinese-title text-center" style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 4px 12px rgba(0,0,0,0.9)' }}>
            选择你要加入的部门
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className={`p-6 rounded-xl text-center transition-all transform hover:scale-110 ${
                  selectedDepartment === dept.id
                    ? 'bg-gradient-to-br from-amber-500/60 to-orange-500/60 shadow-2xl scale-110 border-2 border-amber-300'
                    : 'bg-black/40 hover:bg-black/50 border-2 border-amber-500/30'
                }`}
              >
                <div className="font-bold text-amber-200 mb-2 text-xl text-chinese-title" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.6), 0 2px 8px rgba(0,0,0,0.9)' }}>{dept.name}</div>
                <p className="text-amber-100 text-chinese-elegant" style={{ textShadow: '0 0 8px rgba(251, 191, 36, 0.4), 0 2px 8px rgba(0,0,0,0.9)' }}>{dept.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white font-bold text-chinese-elegant animate-shake text-center text-lg shadow-2xl border-2 border-red-300" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            {error}
          </div>
        )}

        <div className="flex gap-6 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-10 py-4 bg-black/50 hover:bg-black/60 rounded-xl font-bold transition-all text-amber-200 text-chinese-elegant text-xl shadow-lg transform hover:scale-105 border-2 border-amber-500/50"
            style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5), 0 2px 8px rgba(0,0,0,0.9)' }}
          >
            取消
          </button>
          <button
            onClick={handleJoin}
            disabled={isJoining || !selectedDepartment}
            className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl disabled:opacity-50 font-bold transition-all shadow-2xl transform hover:scale-105 text-chinese-elegant text-xl border-2 border-amber-300"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
          >
            {isJoining ? '加入中...' : '加入朝堂'}
          </button>
        </div>
      </div>
    </div>
  );
}
