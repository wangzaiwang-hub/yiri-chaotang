import React, { useMemo, useState, useRef, useEffect } from 'react';
import '../styles/LogModal.css';
import shengzhiImage from '../recourse/shengzhi.png';
import kingImage from '../recourse/king.png';
import queenImage from '../recourse/queen.png';
import boyImage from '../recourse/boy.png';
import girlImage from '../recourse/girl.png';

interface SarcasmLog {
  id: string;
  log_type: string;
  log_message: string;
  related_data?: Record<string, any>;
  created_at: string;
}

interface LogModalProps {
  logs: SarcasmLog[];
  onConfirm: () => void;
  isOpen: boolean;
  emperorInfo?: {
    nickname: string;
    gender: 'male' | 'female';
    avatarUrl?: string;
  };
  ministerInfo?: {
    nickname: string;
    gender: 'male' | 'female';
    avatarUrl?: string;
  };
}

// 无能大臣奖评价列表
const INCOMPETENT_AWARDS = [
  '特颁此奖，表彰爱卿将所有差事办砸的稳定发挥，堪称朝堂反向标杆',
  '别人献策安邦，你献策添乱，最佳成事不足败事有余非你莫属',
  '论办事效率，爱卿称第二，没人敢称第一，毕竟蜗牛都望尘莫及',
  '朕交代之事，到你手中总能完美跑偏，最佳跑偏大臣当之无愧',
  '满朝文武皆在出力，唯有你在划水摸鱼，摸鱼界翘楚实至名归',
  '你的计策堪称纸上谈兵天花板，听之无用，弃之可惜',
  '遇事只会推诿甩锅，最佳甩锅大臣，舍你其谁',
  '办事拖沓无章法，拖延症晚期代表，特此嘉奖',
  '别人运筹帷幄，你手足无措，朝堂慌乱担当非你不可',
  '出谋划策全是馊主意，最佳馊主意研发大臣颁给你',
  '执行能力约等于零，光说不做的嘴强王者',
  '面对政务一窍不通，朝堂懵懂担当，恭喜爱卿',
  '努力半生，一事无成，最佳无效努力大臣殊荣归你',
  '但凡你能靠谱一次，也不至于拿下这个特殊奖项',
  '处理公务漏洞百出，漏洞制造大师，朕属实佩服',
  '别人查漏补缺，你专职制造麻烦，最佳麻烦制造者',
  '献策千言，无一可用，空谈理论第一人',
  '临事退缩，畏手畏脚，朝堂胆小担当特此表彰',
  '简单差事都能办砸，难度越低失误越高，实属奇才',
  '整日浑水摸鱼混朝会，最佳划水摸鱼大臣',
  '思维清奇，总能想出最离谱的解决方案，离谱天花板',
  '上传下达全是纰漏，信息传递终结者',
  '一心想立功，次次帮倒忙，最佳帮倒忙专业户',
  '面对难题束手无策，摆烂态度堪称表率',
  '纵观朝野，无能得如此稳定，唯有爱卿一人'
];

export const LogModal: React.FC<LogModalProps> = ({ 
  logs, 
  onConfirm, 
  isOpen, 
  emperorInfo, 
  ministerInfo 
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // 随机选择一条无能大臣奖评价（使用 useMemo 确保每次打开弹窗时只选择一次）
  const randomAward = useMemo(() => {
    return INCOMPETENT_AWARDS[Math.floor(Math.random() * INCOMPETENT_AWARDS.length)];
  }, [logs.length]); // 当日志数量变化时重新选择

  // 监听滚动事件，检测是否滚动到底部
  useEffect(() => {
    const container = logsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 允许 20px 的误差，更宽松的判断
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
      if (isAtBottom) {
        setHasScrolledToBottom(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    
    // 初始检查是否已经在底部（内容较少时）
    // 使用 setTimeout 确保内容已经渲染完成
    const checkInitialScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
      if (isAtBottom) {
        setHasScrolledToBottom(true);
      }
    };
    
    // 立即检查一次
    checkInitialScroll();
    
    // 延迟检查，确保内容已渲染
    const timer = setTimeout(checkInitialScroll, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [isOpen, logs.length]);

  // 重置滚动状态
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
    }
  }, [isOpen]);

  if (!isOpen || logs.length === 0) {
    return null;
  }

  // 获取头像 - 优先使用真实头像，否则使用默认头像
  const getAvatar = (avatarUrl: string | undefined, gender: 'male' | 'female', isEmperor: boolean) => {
    if (avatarUrl) {
      return avatarUrl;
    }
    if (isEmperor) {
      return gender === 'male' ? kingImage : queenImage;
    } else {
      return gender === 'male' ? boyImage : girlImage;
    }
  };

  const emperorAvatar = getAvatar(emperorInfo?.avatarUrl, emperorInfo?.gender || 'male', true);
  const ministerAvatar = getAvatar(ministerInfo?.avatarUrl, ministerInfo?.gender || 'male', false);
  const emperorName = emperorInfo?.nickname || '皇上';
  const ministerName = ministerInfo?.nickname || '大臣';

  return (
    <div className="log-modal-overlay">
      <div className="log-modal-edict-container">
        {/* 圣旨背景 */}
        <img src={shengzhiImage} alt="圣旨" className="edict-background" />
        
        {/* 内容区域 */}
        <div className="edict-content-wrapper">
          {/* 顶部：大臣信息（左上角） */}
          <div className="edict-header">
            <div className="edict-minister-info">
              <img src={ministerAvatar} alt={ministerName} className="edict-avatar-small" />
              <span className="edict-name">{ministerName}</span>
            </div>
          </div>

          {/* 日志列表区域（可滚动） */}
          <div className="edict-logs-container" ref={logsContainerRef}>
            {logs.map((log) => (
              <div key={log.id} className="edict-log-item">
                {log.log_message}
              </div>
            ))}
            
            {/* 无能大臣奖评价 */}
            <div className="edict-award-section">
              <div className="edict-award-title">【无能大臣奖】</div>
              <div className="edict-award-content">{randomAward}</div>
            </div>
          </div>

          {/* 底部：皇帝信息（右下角） */}
          <div className="edict-footer-info">
            <div className="edict-emperor-info">
              <span className="edict-emperor-name">{emperorName}</span>
              <img src={emperorAvatar} alt={emperorName} className="edict-avatar-small" />
            </div>
          </div>
        </div>

        {/* 确认按钮 */}
        <div className="edict-confirm-wrapper">
          <button
            className="edict-confirm-button"
            onClick={onConfirm}
            disabled={!hasScrolledToBottom}
            title={hasScrolledToBottom ? '' : '请滚动到底部查看完所有内容'}
          >
            臣接旨
          </button>
        </div>
      </div>
    </div>
  );
};
