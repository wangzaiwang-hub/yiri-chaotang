import React, { useState } from 'react';
import '../styles/LogModal.css';

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
}

export const LogModal: React.FC<LogModalProps> = ({ logs, onConfirm, isOpen }) => {
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

  return (
    <div className="log-modal-overlay">
      <div className="log-modal-container">
        {/* 标题 */}
        <div className="log-modal-header">
          <h2>📜 皇帝的毒舌日志</h2>
          <p className="log-modal-subtitle">你有 {logs.length} 条未查看的日志，必须全部查看才能继续游戏</p>
        </div>

        {/* 日志内容 */}
        <div className="log-modal-content">
          <div className="log-message-box">
            <p className="log-message">{currentLog.log_message}</p>
          </div>
        </div>

        {/* 导航栏 */}
        <div className="log-modal-navigation">
          <button
            className="log-nav-button"
            onClick={handlePrev}
            disabled={isFirst}
          >
            ← 上一条
          </button>

          <span className="log-progress">
            {currentIndex + 1} / {logs.length}
          </span>

          <button
            className="log-nav-button"
            onClick={handleNext}
            disabled={isLast}
          >
            下一条 →
          </button>
        </div>

        {/* 确认按钮 */}
        <div className="log-modal-footer">
          <button
            className="log-confirm-button"
            onClick={handleConfirm}
            disabled={!isLast}
          >
            {isLast ? `✅ 确认 (${logs.length} 条日志已全部查看)` : `查看更多日志... (${currentIndex + 1}/${logs.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
