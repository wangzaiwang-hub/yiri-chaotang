import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { courtAPI, taskAPI } from '../services/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 导入图片 - 使用相对路径
import bgImage from '../recourse/bg.png';
import kingImage from '../recourse/king.png';
import queenImage from '../recourse/queen.png';
import slaveImage from '../recourse/slave.png';

export default function Court() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedSlave, setSelectedSlave] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  const { data: courts } = useQuery({
    queryKey: ['courts', user?.id],
    queryFn: () => courtAPI.list(user!.id),
    enabled: !!user,
  });

  const currentCourt = courts?.data.data?.[0];

  const { data: rankingRes } = useQuery({
    queryKey: ['ranking', currentCourt?.id],
    queryFn: () => courtAPI.getRanking(currentCourt?.id),
    enabled: !!currentCourt,
  });

  // 暂时不使用 tasks 数据
  // const { data: tasksRes } = useQuery({
  //   queryKey: ['tasks', currentCourt?.id],
  //   queryFn: () => taskAPI.list(currentCourt?.id),
  //   enabled: !!currentCourt,
  // });

  const ranking = rankingRes?.data.data || [];
  // const tasks = tasksRes?.data.data || [];
  const emperor = ranking.find((m: any) => m.role === 'emperor');
  const ministers = ranking.filter((m: any) => m.role === 'minister');
  const isEmperor = emperor?.user_id === user?.id;

  const handleAssignTask = (minister: any) => {
    if (!isEmperor) {
      alert('只有皇帝才能发布圣旨！');
      return;
    }
    setSelectedSlave(minister);
    setShowTaskModal(true);
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskDescription.trim()) {
      alert('请填写完整的任务信息');
      return;
    }

    try {
      await taskAPI.create({
        court_id: currentCourt.id,
        emperor_id: user!.id,
        assignee_id: selectedSlave.user_id,
        title: taskTitle,
        description: taskDescription,
        task_type: 'brain',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDescription('');
      alert('圣旨已下达！');
    } catch (error) {
      console.error('发布任务失败:', error);
      alert('发布任务失败，请重试');
    }
  };

  if (!currentCourt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>请先创建或加入一个朝堂</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 左上角按钮 */}
      <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
        <button
          onClick={() => navigate('/')}
          className="bg-cyan-400 hover:bg-cyan-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg text-lg"
        >
          邀请好友
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-cyan-400 hover:bg-cyan-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg text-lg"
        >
          得令，皇上
        </button>
      </div>

      {/* 右上角怨气值 */}
      <div className="absolute top-6 right-6 bg-cyan-400 rounded-2xl p-6 shadow-lg z-10 min-w-[200px]">
        <h3 className="text-white font-bold text-2xl mb-3">怨气值：</h3>
        {ministers.slice(0, 3).map((m: any, i: number) => (
          <div key={m.id} className="text-white font-bold text-lg mb-1">
            奴才 {i + 1}:
            <span className={m.grudge_value > 80 ? 'text-red-600 ml-2' : 'text-yellow-300 ml-2'}>
              {m.grudge_value}
            </span>
          </div>
        ))}
      </div>

      {/* 中央区域 */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-32 pb-20">
        {/* 任务气泡 - 在皇帝上方 */}
        {isEmperor && ministers.length > 0 && (
          <div className="bg-cyan-400 rounded-3xl p-6 shadow-lg mb-8 max-w-lg relative">
            <p className="text-white font-bold text-xl text-center">
              奴才 1，你给朕做一个 ppt
            </p>
            {/* 气泡尾巴 */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-cyan-400"></div>
            </div>
          </div>
        )}

        {/* 皇帝/皇后 */}
        {emperor && (
          <div className="relative mb-16">
            <img
              src={emperor.user.gender === 'female' ? queenImage : kingImage}
              alt="Emperor"
              className="w-80 h-80 object-contain drop-shadow-2xl"
            />
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white px-8 py-3 rounded-full shadow-xl border-4 border-amber-400">
              <p className="text-amber-900 font-bold text-xl text-center">皇上</p>
            </div>
          </div>
        )}

        {/* 奴才们 */}
        <div className="flex gap-12 items-end mt-8">
          {ministers.slice(0, 4).map((minister: any) => (
            <div
              key={minister.id}
              className="relative cursor-pointer transform hover:scale-110 transition-transform duration-200"
              onClick={() => handleAssignTask(minister)}
            >
              <img
                src={slaveImage}
                alt="Minister"
                className="w-40 h-40 object-contain drop-shadow-xl"
              />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-bold whitespace-nowrap border-2 border-gray-300">
                {minister.user.nickname}
              </div>
              {minister.grudge_value > 80 && (
                <div className="absolute -top-4 -right-4 text-4xl animate-bounce">😤</div>
              )}
            </div>
          ))}
        </div>

        {/* 如果没有奴才 */}
        {ministers.length === 0 && (
          <div className="mt-12 bg-white bg-opacity-90 rounded-2xl p-8 shadow-xl">
            <p className="text-gray-700 font-bold text-xl text-center">
              还没有奴才，快去邀请好友吧！
            </p>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="mt-20 flex gap-6">
          {isEmperor && ministers.length > 0 && (
            <button
              onClick={() => navigate('/tasks')}
              className="bg-cyan-400 hover:bg-cyan-500 text-white px-10 py-4 rounded-2xl font-bold shadow-lg text-xl transform hover:scale-105 transition"
            >
              发布任务
            </button>
          )}
        </div>
      </div>

      {/* 发布任务弹窗 */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-bold text-amber-900 mb-6">
              给 {selectedSlave?.user.nickname} 下圣旨
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务标题
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="例如：给朕做一个 PPT"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务详情
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="详细描述任务要求..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold"
              >
                取消
              </button>
              <button
                onClick={handleCreateTask}
                className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg"
              >
                下达圣旨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
