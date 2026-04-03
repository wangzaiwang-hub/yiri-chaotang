import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { courtAPI, taskAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Throne() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    task_type: 'brain',
    assignee_id: '',
    deadline: '',
    grudge_reward: 10,
  });

  const { data: courts } = useQuery({
    queryKey: ['courts', user?.id],
    queryFn: () => courtAPI.list(user!.id),
  });

  const currentCourt = courts?.data.data?.[0];

  const { data: membersRes } = useQuery({
    queryKey: ['members', currentCourt?.id],
    queryFn: () => courtAPI.getMembers(currentCourt!.id),
    enabled: !!currentCourt,
  });

  const members = membersRes?.data.data || [];

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => taskAPI.create(data),
    onSuccess: () => {
      alert('圣旨已颁布！');
      setTaskForm({
        title: '',
        description: '',
        task_type: 'brain',
        assignee_id: '',
        deadline: '',
        grudge_reward: 10,
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      ...taskForm,
      court_id: currentCourt?.id,
      emperor_id: user?.id,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900">👑 帝王宝座</h1>
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            返回朝堂
          </button>
        </div>

        {/* 发布任务表单 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">👑 朕有旨（新任务）</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                任务类型
              </label>
              <select
                value={taskForm.task_type}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, task_type: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="brain">脑力任务</option>
                <option value="creative">创作任务</option>
                <option value="social">社交任务</option>
                <option value="talent">才艺任务</option>
                <option value="entertainment">娱乐任务</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                任务标题
              </label>
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                placeholder="例如：帮朕写周报"
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                任务描述
              </label>
              <textarea
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                placeholder="命虚拟分身写一份述职报告..."
                className="w-full border rounded-lg px-4 py-2 h-32"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                指定分身
              </label>
              <select
                value={taskForm.assignee_id}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, assignee_id: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">选择臣子</option>
                {members
                  .filter((m: any) => m.role === 'minister')
                  .map((member: any) => (
                    <option key={member.id} value={member.user_id}>
                      {member.user.nickname}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                截止时间
              </label>
              <input
                type="datetime-local"
                value={taskForm.deadline}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, deadline: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition"
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? '颁布中...' : '📢 颁布圣旨'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
