import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { taskAPI, courtAPI } from '../services/api';

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: '待规划', color: 'bg-gray-100 text-gray-700', icon: '📋' },
  planning: { label: '规划中', color: 'bg-blue-100 text-blue-700', icon: '📜' },
  reviewing: { label: '审核中', color: 'bg-purple-100 text-purple-700', icon: '🔍' },
  rejected: { label: '已封驳', color: 'bg-red-100 text-red-700', icon: '🚫' },
  approved: { label: '已准奏', color: 'bg-green-100 text-green-700', icon: '✅' },
  dispatching: { label: '派发中', color: 'bg-yellow-100 text-yellow-700', icon: '📮' },
  executing: { label: '执行中', color: 'bg-orange-100 text-orange-700', icon: '⚔️' },
  reporting: { label: '汇总中', color: 'bg-indigo-100 text-indigo-700', icon: '📊' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700', icon: '🎉' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: '❌' },
};

const DEPARTMENT_MAP: Record<string, { name: string; icon: string }> = {
  emperor: { name: '皇帝', icon: '👑' },
  zhongshu: { name: '中书省', icon: '📜' },
  menxia: { name: '门下省', icon: '🔍' },
  shangshu: { name: '尚书省', icon: '📮' },
  hubu: { name: '户部', icon: '💰' },
  libu: { name: '礼部', icon: '📝' },
  bingbu: { name: '兵部', icon: '⚔️' },
  xingbu: { name: '刑部', icon: '⚖️' },
  gongbu: { name: '工部', icon: '🔧' },
  libu_hr: { name: '吏部', icon: '📋' },
};

export default function Tasks() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [, setMembers] = useState<any[]>([]);
  const [myMember, setMyMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadCourts();
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (selectedCourt) {
      loadTasks();
      loadMembers();
    }
  }, [selectedCourt]);

  const loadCourts = async () => {
    try {
      const res = await courtAPI.list(user!.id);
      setCourts(res.data.data || []);
      if (res.data.data?.length > 0) {
        setSelectedCourt(res.data.data[0].id);
      }
    } catch (error) {
      console.error('加载朝堂列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await taskAPI.list(selectedCourt);
      setTasks(res.data.data || []);
    } catch (error) {
      console.error('加载任务列表失败:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await courtAPI.getMembers(selectedCourt);
      const membersList = res.data.data || [];
      setMembers(membersList);
      
      // 找到当前用户的成员信息
      const me = membersList.find((m: any) => m.user_id === user!.id);
      setMyMember(me);
    } catch (error) {
      console.error('加载成员列表失败:', error);
    }
  };

  const handleAction = async (taskId: string, action: string) => {
    try {
      switch (action) {
        case 'plan':
          await taskAPI.plan(taskId, user!.id);
          break;
        case 'review':
          const approved = window.confirm('是否准奏此方案？点击"确定"准奏，点击"取消"封驳');
          await taskAPI.review(taskId, user!.id, approved);
          break;
        case 'dispatch':
          await taskAPI.dispatch(taskId, user!.id);
          break;
        case 'execute':
          await taskAPI.execute(taskId, user!.id);
          break;
        case 'report':
          await taskAPI.report(taskId, user!.id);
          break;
      }
      
      alert('操作成功！');
      loadTasks();
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败，请重试');
    }
  };

  const canPerformAction = (task: any, action: string): boolean => {
    if (!myMember) return false;
    
    const myDept = myMember.department;
    
    switch (action) {
      case 'plan':
        return myDept === 'zhongshu' && task.status === 'pending';
      case 'review':
        return myDept === 'menxia' && task.status === 'reviewing';
      case 'dispatch':
        return myDept === 'shangshu' && task.status === 'approved';
      case 'execute':
        return ['hubu', 'libu', 'bingbu', 'xingbu', 'gongbu', 'libu_hr'].includes(myDept) && task.status === 'executing';
      case 'report':
        return myDept === 'shangshu' && task.status === 'reporting';
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">你还没有加入任何朝堂</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900">
            📋 三省六部·任务看板
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md"
          >
            返回首页
          </button>
        </div>

        {/* 朝堂选择 */}
        {courts.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 我的部门 */}
        {myMember && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{DEPARTMENT_MAP[myMember.department]?.icon}</span>
              <span className="font-semibold text-gray-800">
                我的部门：{DEPARTMENT_MAP[myMember.department]?.name}
              </span>
              <span className="ml-auto text-sm text-gray-600">
                怨气值：{myMember.grudge_value}
              </span>
            </div>
          </div>
        )}

        {/* 任务列表 */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600">暂无任务</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {task.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>👑 {task.emperor?.nickname}</span>
                      {task.assignee && (
                        <span>👤 {task.assignee?.nickname}</span>
                      )}
                      {task.department && (
                        <span>
                          {DEPARTMENT_MAP[task.department]?.icon} {DEPARTMENT_MAP[task.department]?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${STATUS_MAP[task.status]?.color}`}>
                    {STATUS_MAP[task.status]?.icon} {STATUS_MAP[task.status]?.label}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  {canPerformAction(task, 'plan') && (
                    <button
                      onClick={() => handleAction(task.id, 'plan')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                      📜 规划任务
                    </button>
                  )}
                  {canPerformAction(task, 'review') && (
                    <button
                      onClick={() => handleAction(task.id, 'review')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                    >
                      🔍 审核方案
                    </button>
                  )}
                  {canPerformAction(task, 'dispatch') && (
                    <button
                      onClick={() => handleAction(task.id, 'dispatch')}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm"
                    >
                      📮 派发任务
                    </button>
                  )}
                  {canPerformAction(task, 'execute') && (
                    <button
                      onClick={() => handleAction(task.id, 'execute')}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm"
                    >
                      ⚔️ 执行任务
                    </button>
                  )}
                  {canPerformAction(task, 'report') && (
                    <button
                      onClick={() => handleAction(task.id, 'report')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                    >
                      📊 汇总回奏
                    </button>
                  )}
                </div>

                {/* 显示规划方案 */}
                {task.plan && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">📜 中书省规划方案：</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{task.plan}</p>
                  </div>
                )}

                {/* 显示审核意见 */}
                {task.review_comment && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">🔍 门下省审核意见：</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{task.review_comment}</p>
                  </div>
                )}

                {/* 显示执行结果 */}
                {task.result && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">✅ 执行结果：</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{task.result}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
