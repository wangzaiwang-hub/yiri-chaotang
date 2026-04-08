import React, { useState } from 'react';
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
  };
  ministerInfo?: {
    nickname: string;
    gender: 'male' | 'female';
  };
}

export const LogModal: React.FC<LogModalProps> = ({ 
  logs, 
  onConfirm, 
  isOpen, 
  emperorInfo, 
  ministerInfo 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || logs.length === 0) {
    return null;
  }

  const currentLog = logs[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === logs.length - 1;

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  // 获取头像
  const getAvatar = (gender: 'male' | 'female', isEmperor: boolean) => {
    if (isEmperor) {
      return gender === 'male' ? kingImage : queenImage;
    } else {
      return gender === 'male' ? boyImage : girlImage;
    }
  };

  const emperorAvatar = emperorInfo ? getAvatar(emperorInfo.gender, true) : kingImage;
  const ministerAvatar = ministerInfo ? getAvatar(ministerInfo.gender, false) : boyImage;

  return (
    <div className="log-modal-overlay">
      <div className="log-modal-edict-container">
        {/* 圣旨背景 */}
        <img src={shengzhiImage} alt="圣旨" className="edict-background" />
        
        {/* 内容区域 */}
        <div className="edict-content-wrapper">
          {/* 左侧：皇帝信息 */}
          <div className="edict-emperor-section">
            <img src={emperorAvatar} alt="皇帝" className="edict-avatar" />
            <div className="edict-name-vertical">{emperorInfo?.nickname || '皇上'}</div>
          </div>

          {/* 中间：日志内容（竖排文字） */}
          <div className="edict-message-section">
            <div className="edict-message-vertical">
              {currentLog.log_message}
            </div>
          </div>

          {/* 右侧：大臣信息 */}
          <div className="edict-minister-section">
            <img src={ministerAvatar} alt="大臣" className="edict-avatar" />
            <div className="edict-name-vertical">{ministerInfo?.nickname || '大臣'}</div>
          </div>
        </div>

        {/* 导航控制 */}
        <div className="edict-navigation">
          <button
            className="edict-nav-button"
            onClick={handlePrev}
            disabled={isFirst}
          >
            ← 上一条
          </button>

          <span className="edict-progress">
            {currentIndex + 1} / {logs.length}
          </span>

          <button
            className="edict-nav-button"
            onClick={handleNext}
            disabled={isLast}
          >
            下一条 →
          </button>
        </div>

        {/* 确认按钮 */}
        <div className="edict-footer">
          <button
            className="edict-confirm-button"
            onClick={handleConfirm}
            disabled={!isLast}
          >
            {isLast ? `朕已阅 (${logs.length}/${logs.length})` : `继续阅读 (${currentIndex + 1}/${logs.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
