import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { courtAPI, taskAPI, fileAPI, ttsAPI, boredAPI, whisperAPI, territoryAPI } from '../services/api';
import { useState, useEffect, useRef } from 'react';

// 导入图片资源
import bgImage from '../recourse/bg.png';
import bgVideo from '../recourse/bg.mp4';
import kingImage from '../recourse/king.png';
import queenImage from '../recourse/queen.png';
import slaveImage from '../recourse/slave.png';
import endImage from '../recourse/end.png';
import agreeImage from '../recourse/agree.png';
import disagreeImage from '../recourse/disagree.png';
import thinkingGif from '../recourse/thinking.gif';
import ideaGif from '../recourse/idea.gif';
import shengzhiImage from '../recourse/shengzhi.png';
import gongnvImage from '../recourse/gongnv.png';
import cardBackImage from '../recourse/card_back.png';
import cardFrontImage from '../recourse/card_front.png';
import qiuraoGif from '../recourse/qiurao.gif';
import jiantaoImage from '../recourse/jiantao.png';

// 导入国家场景图片
import huaxiaScene from '../recourse/Country/huaxia.jpg';
import dongyingScene from '../recourse/Country/dongying.jpg';
import gaoliScene from '../recourse/Country/gaoli.jpg';
import annanScene from '../recourse/Country/annan.jpeg';
import xianluoScene from '../recourse/Country/xianluo.jpeg';
import dashiScene from '../recourse/Country/dashi.jpeg';

// 导入百姓状态图片
import qiongImage from '../recourse/Country/qiong.png';
import qiangImage from '../recourse/Country/qiang.png';
import fuImage from '../recourse/Country/fu.png';

// 导入场景卡片图片
import bgCardBack from '../recourse/Country/bg_card_back.jpg';
import bgCardFront from '../recourse/Country/bg_card_front.png';

// 导入征战视频
import conquestVideo from '../recourse/Country/loading.mov';

export default function Home() {
  const { user, token } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedSlave, setSelectedSlave] = useState<any>(null);
  const [courtName, setCourtName] = useState('');
  const [courtDescription, setCourtDescription] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [displayedTasks, setDisplayedTasks] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTaskForRejection, setSelectedTaskForRejection] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalButtons, setShowApprovalButtons] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [draggedFile, setDraggedFile] = useState<any>(null);
  const [fileOrder, setFileOrder] = useState<any[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedTaskForApproval, setSelectedTaskForApproval] = useState<any>(null);
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [showPunishModal, setShowPunishModal] = useState(false);
  const [selectedTaskForPunishment, setSelectedTaskForPunishment] = useState<any>(null);
  const [punishmentContent, setPunishmentContent] = useState('');
  const [showPunishmentAnimation, setShowPunishmentAnimation] = useState(false);
  const [generatedPunishmentText, setGeneratedPunishmentText] = useState('');
  const [showPunishmentResult, setShowPunishmentResult] = useState(false);
  
  // 悄悄话相关状态
  const [showWhisperModal, setShowWhisperModal] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState<any>(null);
  const [whisperMessage, setWhisperMessage] = useState('');
  const [currentWhisper, setCurrentWhisper] = useState<any>(null);
  const [displayedWhisperMessage, setDisplayedWhisperMessage] = useState('');
  const [displayedWhisperReply, setDisplayedWhisperReply] = useState('');
  const [isWhisperTyping, setIsWhisperTyping] = useState(false);
  const [whisperPhase, setWhisperPhase] = useState<'input' | 'message_bubble' | 'waiting_reply' | 'reply_bubble' | 'done'>('done');
  
  // 思考状态：'thinking' | 'idea' | 'none'
  const [thinkingState, setThinkingState] = useState<'thinking' | 'idea' | 'none'>('none');
  
  // 动画流程状态：'emperor_bubble' | 'waiting_ai' | 'ai_ready' | 'minister_bubble' | 'done'
  const [animationPhase, setAnimationPhase] = useState<'emperor_bubble' | 'waiting_ai' | 'ai_ready' | 'minister_bubble' | 'done'>('done');
  
  // 无聊提示语
  const [boredMessage, setBoredMessage] = useState('');
  const [showBoredBubble, setShowBoredBubble] = useState(false);
  
  // 性别选择相关状态
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [isSubmittingGender, setIsSubmittingGender] = useState(false);
  
  // 重生转世下拉列表状态
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);
  
  // 召唤分身相关状态
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [availableBots, setAvailableBots] = useState<any[]>([]);
  const [isSummoning, setIsSummoning] = useState(false);
  
  // 翻牌动画相关状态
  const [showCardFlip, setShowCardFlip] = useState(false);
  const [selectedBot, setSelectedBot] = useState<any>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  
  // 疆土拓展相关状态
  const [showTerritoryModal, setShowTerritoryModal] = useState(false);
  const [availableScenes, setAvailableScenes] = useState<any[]>([]);
  const [showSceneCardFlip, setShowSceneCardFlip] = useState(false);
  const [selectedScene, setSelectedScene] = useState<any>(null);
  const [isFlippingScene, setIsFlippingScene] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<string>('huaxia');
  
  // 征战视频相关状态
  const [showConquestVideo, setShowConquestVideo] = useState(false);
  const [isConquesting, setIsConquesting] = useState(false);
  
  // 幸福值系统
  const [happiness, setHappiness] = useState<number>(0);
  const [unlockedScenes, setUnlockedScenes] = useState<string[]>(['default']);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  
  // 音频播放相关
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioReady, setAudioReady] = useState(false); // 音频已准备好但未播放
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false); // 正在生成音频
  const audioEndPromiseRef = useRef<((value: void) => void) | null>(null); // 用于等待音频结束
  
  // 手动播放音频
  const manualPlayAudio = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        console.log('🔊 手动播放成功');
        setIsPlayingAudio(true);
        setAudioReady(false);
        showToast('正在播放语音...', 'success');
      } catch (error) {
        console.error('🔊 手动播放失败:', error);
        showToast('播放失败', 'error');
      }
    }
  };
  
  // 等待音频播放完成
  const waitForAudioEnd = (): Promise<void> => {
    return new Promise((resolve) => {
      const audio = audioRef.current;
      
      console.log('🎵 开始等待音频播放完成', { 
        hasAudio: !!audio,
        paused: audio?.paused,
        ended: audio?.ended,
        currentTime: audio?.currentTime,
        duration: audio?.duration,
        isPlayingAudio, 
        isGeneratingAudio, 
        audioReady
      });
      
      // 如果已经有 resolve 在等待，先清除
      if (audioEndPromiseRef.current) {
        console.log('⚠️ 已有等待中的 Promise，先清除');
        audioEndPromiseRef.current();
      }
      
      // 检查音频元素状态
      if (!audio || audio.ended || audio.paused) {
        // 如果没有音频或已结束，立即 resolve
        console.log('🎵 没有音频或已结束，立即继续');
        resolve();
        return;
      }
      
      // 保存 resolve 函数，在音频结束时调用
      audioEndPromiseRef.current = resolve;
      console.log('🎵 已保存 resolve 函数，等待音频结束事件');
      
      // 超时保护：20 秒后自动 resolve
      setTimeout(() => {
        if (audioEndPromiseRef.current === resolve) {
          console.log('⏰ 等待音频超时（20秒），强制继续流程');
          audioEndPromiseRef.current();
          audioEndPromiseRef.current = null;
        }
      }, 20000);
    });
  };
  
  // 开始播放 TTS（生成并开始播放，返回 Promise 在真正播放时 resolve）
  const startPlayTTS = async (text: string, userId: string): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        console.log('🔊 开始生成 TTS 语音...', { textLength: text.length, userId });
        setIsGeneratingAudio(true);
        setIsPlayingAudio(false);
        setAudioReady(false);
        
        // 清理 Markdown 格式和工具调用标记
        const cleanText = cleanContent(text);
        console.log('🔊 清理后的文本:', cleanText.substring(0, 100) + '...');
        
        // 调用 TTS API
        const response = await ttsAPI.generate(cleanText, userId);
        console.log('🔊 TTS API 响应:', JSON.stringify(response.data, null, 2));
        
        setIsGeneratingAudio(false);
        
        if (response.data?.data?.url) {
          const audioUrl = response.data.data.url;
          console.log('🔊 音频 URL:', audioUrl);
          
          // 创建音频元素并播放
          const audio = new Audio();
          audioRef.current = audio;
          
          // 设置音频属性
          audio.crossOrigin = 'anonymous';
          audio.preload = 'auto';
          audio.volume = 1.0;
          
          audio.onloadstart = () => {
            console.log('🔊 开始加载音频...');
          };
          
          audio.oncanplay = () => {
            console.log('🔊 音频可以播放了');
          };
          
          // 当音频真正开始播放时，resolve Promise
          audio.onplay = () => {
            console.log('🔊 音频开始播放');
            setIsPlayingAudio(true);
            resolve(true); // 播放成功，resolve
          };
          
          audio.onended = () => {
            console.log('🔊 音频播放完成');
            setIsPlayingAudio(false);
            setAudioReady(false);
            
            // 调用等待的 resolve
            if (audioEndPromiseRef.current) {
              audioEndPromiseRef.current();
              audioEndPromiseRef.current = null;
            }
          };
          
          audio.onerror = (e) => {
            console.error('🔊 音频播放失败:', e);
            setIsPlayingAudio(false);
            setAudioReady(false);
            showToast('语音播放失败', 'error');
            
            // 调用等待的 resolve
            if (audioEndPromiseRef.current) {
              audioEndPromiseRef.current();
              audioEndPromiseRef.current = null;
            }
            
            resolve(false); // 播放失败
          };
          
          // 设置音频源
          audio.src = audioUrl;
          
          // 尝试播放
          try {
            const playPromise = audio.play();
            console.log('🔊 播放命令已发送');
            
            await playPromise;
            console.log('🔊 play() Promise 完成');
            // 不在这里 resolve，等待 onplay 事件
          } catch (playError: any) {
            console.error('🔊 播放被阻止:', playError);
            
            if (playError.name === 'NotAllowedError') {
              console.log('🔊 浏览器阻止了自动播放，显示手动播放按钮');
              setIsPlayingAudio(false);
              setAudioReady(true);
              showToast('点击播放按钮收听语音', 'error');
              
              // 自动播放被阻止，调用等待的 resolve
              if (audioEndPromiseRef.current) {
                setTimeout(() => {
                  if (audioEndPromiseRef.current) {
                    audioEndPromiseRef.current();
                    audioEndPromiseRef.current = null;
                  }
                }, 3000);
              }
              
              resolve(false); // 播放被阻止
            } else {
              throw playError;
            }
          }
        } else {
          console.warn('🔊 TTS API 未返回音频 URL');
          setIsPlayingAudio(false);
          setAudioReady(false);
          showToast('语音生成失败', 'error');
          resolve(false);
        }
      } catch (error: any) {
        console.error('🔊 TTS 生成失败:', error);
        console.error('🔊 错误详情:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setIsGeneratingAudio(false);
        setIsPlayingAudio(false);
        setAudioReady(false);
        showToast('语音生成失败', 'error');
        resolve(false);
      }
    });
  };
  
  // WebSocket 引用
  const wsRef = useRef<WebSocket | null>(null);
  
  // 圣旨动画相关（暂未使用）
  // const [showShengzhiAnimation, setShowShengzhiAnimation] = useState(false);
  // const [shengzhiText, setShengzhiText] = useState('');

  // 清理工具调用标记的函数
  const cleanToolCallMarkers = (text: string): string => {
    if (!text) return '';
    // 移除 [TOOL_CALL]...[/TOOL_CALL] 标记
    let cleaned = text.replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g, '');
    // 移除 [MCP_CALL]...[/MCP_CALL] 标记
    cleaned = cleaned.replace(/\[MCP_CALL\][\s\S]*?\[\/MCP_CALL\]/g, '');
    return cleaned.trim();
  };

  // 获取文件图标
  const getFileIcon = (filename: string): JSX.Element => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // 根据文件类型返回不同的图标
    const iconClass = "w-full h-full flex items-center justify-center text-2xl font-bold";
    
    switch(ext) {
      case 'md':
        return (
          <div className={iconClass} style={{ color: '#0066cc' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z" />
            </svg>
          </div>
        );
      case 'html':
        return (
          <div className={iconClass} style={{ color: '#e34c26' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,17.56L16.07,16.43L16.62,10.33H9.38L9.2,8.3H16.8L17,6.31H7L7.56,12.32H14.45L14.22,14.9L12,15.5L9.78,14.9L9.64,13.24H7.64L7.93,16.43L12,17.56M4.07,3H19.93L18.5,19.2L12,21L5.5,19.2L4.07,3Z" />
            </svg>
          </div>
        );
      case 'pdf':
        return (
          <div className={iconClass} style={{ color: '#d32f2f' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.5,16C15.5,16.65 15.3,17.25 15,17.65C14.75,18.1 14.35,18.3 14,18.3C13.65,18.3 13.25,18.1 13,17.65C12.7,17.25 12.5,16.65 12.5,16V14.5C12.5,13.85 12.7,13.25 13,12.85C13.25,12.4 13.65,12.2 14,12.2C14.35,12.2 14.75,12.4 15,12.85C15.3,13.25 15.5,13.85 15.5,14.5V16M18.5,16C18.5,16.65 18.3,17.25 18,17.65C17.75,18.1 17.35,18.3 17,18.3C16.65,18.3 16.25,18.1 16,17.65C15.7,17.25 15.5,16.65 15.5,16V14.5C15.5,13.85 15.7,13.25 16,12.85C16.25,12.4 16.65,12.2 17,12.2C17.35,12.2 17.75,12.4 18,12.85C18.3,13.25 18.5,13.85 18.5,14.5V16Z" />
            </svg>
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className={iconClass} style={{ color: '#2b579a' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
      case 'txt':
        return (
          <div className={iconClass} style={{ color: '#666666' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19H8V17H10V19M14,19H12V17H14V19M10,15H8V13H10V15M14,15H12V13H14V15M10,11H8V9H10V11M14,11H12V9H14V11Z" />
            </svg>
          </div>
        );
      case 'json':
      case 'xml':
        return (
          <div className={iconClass} style={{ color: '#f39c12' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5,3H7V5H5V10A2,2 0 0,1 3,12A2,2 0 0,1 5,14V19H7V21H5C3.93,20.73 3,20.1 3,19V15A2,2 0 0,0 1,13H0V11H1A2,2 0 0,0 3,9V5A2,2 0 0,1 5,3M19,3A2,2 0 0,1 21,5V9A2,2 0 0,0 23,11H24V13H23A2,2 0 0,0 21,15V19A2,2 0 0,1 19,21H17V19H19V14A2,2 0 0,1 21,12A2,2 0 0,1 19,10V5H17V3H19M12,15A1,1 0 0,1 13,16A1,1 0 0,1 12,17A1,1 0 0,1 11,16A1,1 0 0,1 12,15M8,15A1,1 0 0,1 9,16A1,1 0 0,1 8,17A1,1 0 0,1 7,16A1,1 0 0,1 8,15M16,15A1,1 0 0,1 17,16A1,1 0 0,1 16,17A1,1 0 0,1 15,16A1,1 0 0,1 16,15Z" />
            </svg>
          </div>
        );
      case 'csv':
      case 'xls':
      case 'xlsx':
        return (
          <div className={iconClass} style={{ color: '#217346' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z" />
            </svg>
          </div>
        );
      case 'ppt':
      case 'pptx':
        return (
          <div className={iconClass} style={{ color: '#d24726' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,10.5V13.5L12,12L10,10.5Z" />
            </svg>
          </div>
        );
      case 'zip':
      case 'rar':
        return (
          <div className={iconClass} style={{ color: '#9c27b0' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,17H12V15H10V13H12V15H14M14,9H12V7H14M10,11H12V9H10M14,13H12V11H14M20,6H12L10,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8A2,2 0 0,0 20,6Z" />
            </svg>
          </div>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <div className={iconClass} style={{ color: '#4caf50' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
            </svg>
          </div>
        );
      case 'mp3':
        return (
          <div className={iconClass} style={{ color: '#ff9800' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
            </svg>
          </div>
        );
      case 'mp4':
      case 'avi':
        return (
          <div className={iconClass} style={{ color: '#f44336' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={iconClass} style={{ color: '#757575' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
    }
  };

  // 获取文件类型
  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'md': 'Markdown',
      'html': 'HTML',
      'pdf': 'PDF',
      'doc': 'Word',
      'docx': 'Word',
      'txt': '文本',
      'json': 'JSON',
      'xml': 'XML',
      'csv': 'CSV',
      'xls': 'Excel',
      'xlsx': 'Excel',
      'ppt': 'PPT',
      'pptx': 'PPT',
      'zip': '压缩包',
      'rar': '压缩包',
      'jpg': '图片',
      'jpeg': '图片',
      'png': '图片',
      'gif': '图片',
      'mp3': '音频',
      'mp4': '视频',
      'avi': '视频',
    };
    return typeMap[ext || ''] || '未知';
  };

  // 清理 Markdown 格式的函数
  const cleanMarkdown = (text: string): string => {
    if (!text) return '';
    return text
      // 移除加粗 **text** 或 __text__
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      // 移除斜体 *text* 或 _text_
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // 移除标题 ## text
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      // 移除列表标记 - text 或 * text 或 1. text
      .replace(/^[\-\*]\s+(.+)$/gm, '$1')
      .replace(/^\d+\.\s+(.+)$/gm, '$1')
      // 移除代码块 ```code```
      .replace(/```[\s\S]*?```/g, '')
      // 移除行内代码 `code`
      .replace(/`(.+?)`/g, '$1')
      // 移除链接 [text](url)
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      // 移除图片 ![alt](url)
      .replace(/!\[.+?\]\(.+?\)/g, '')
      // 移除引用 > text
      .replace(/^>\s+(.+)$/gm, '$1')
      // 移除分隔线 --- 或 ***
      .replace(/^[\-\*]{3,}$/gm, '')
      // 清理多余的空行
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  
  // 综合清理函数 - 先清理工具调用标记，再清理 Markdown
  const cleanContent = (text: string): string => {
    return cleanMarkdown(cleanToolCallMarkers(text));
  };

  // Toast 提示函数
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // TTS 播放函数
  const { data: courts, refetch: refetchCourts } = useQuery({
    queryKey: ['courts', user?.id],
    queryFn: () => courtAPI.list(user!.id),
    enabled: !!user,
  });

  // 选择当前朝堂：优先使用 localStorage 中记住的朝堂，否则使用最新加入的
  const [currentCourtId, setCurrentCourtId] = useState<string | null>(() => {
    return localStorage.getItem('currentCourtId');
  });

  const currentCourt = courts?.data.data?.find((c: any) => c.id === currentCourtId) || courts?.data.data?.[0];

  // 当朝堂改变时，保存到 localStorage
  useEffect(() => {
    if (currentCourt?.id && currentCourt.id !== currentCourtId) {
      localStorage.setItem('currentCourtId', currentCourt.id);
      setCurrentCourtId(currentCourt.id);
    }
  }, [currentCourt?.id, currentCourtId]);

  const { data: tasksRes, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', currentCourt?.id],
    queryFn: () => taskAPI.list(currentCourt?.id),
    enabled: !!currentCourt,
    refetchInterval: 2000, // 每 2 秒自动刷新一次
    refetchIntervalInBackground: true, // 即使窗口不在前台也继续刷新
  });

  const tasks = tasksRes?.data.data || [];

  // WebSocket 连接
  useEffect(() => {
    if (!currentCourt || !user) return;

    // 直接连接到后端 WebSocket
    const wsUrl = 'wss://backend-production-a216.up.railway.app/ws';
    
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;

    websocket.onopen = () => {
      // 加入朝堂
      const joinMessage = {
        type: 'join',
        courtId: currentCourt.id,
        userId: user.id
      };
      websocket.send(JSON.stringify(joinMessage));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'new_task' || data.type === 'task_updated') {
        // 收到新任务或任务更新，刷新任务列表
        refetchTasks();
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      // WebSocket 已断开
      wsRef.current = null;
    };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
      wsRef.current = null;
    };
  }, [currentCourt?.id, user?.id]);

  // 打字机效果 - 完整的动画流程控制
  useEffect(() => {
    if (tasks.length === 0) {
      // 只有在不是关闭动画进行中时才清空
      if (animationPhase !== 'emperor_bubble' || !isTyping) {
        setDisplayedTasks([]);
        setAnimationPhase('done');
        setThinkingState('none');
      }
      return;
    }

    const newTask = tasks[0];
    console.log('🔄 任务更新检测', {
      isEmperor,
      taskId: newTask.id,
      status: newTask.status,
      approval_status: newTask.approval_status,
      hasResult: !!newTask.result,
      resultPreview: newTask.result?.substring(0, 30),
      animationPhase,
      displayedTaskId: displayedTasks[0]?.id,
      conversationLength: newTask.conversation_history?.length,
      displayedConversationLength: displayedTasks[0]?.conversation_history?.length,
      lastMessageRole: newTask.conversation_history?.[newTask.conversation_history.length - 1]?.role
    });
    
    // 检测任务关闭 - 显示"此间事了"气泡（皇帝和大臣都显示）
    // 修改检测逻辑：只要新任务是 closed 状态，且 displayedTasks 不是 closed，就触发
    const isTaskClosing = newTask.approval_status === 'closed' && 
                         (displayedTasks.length === 0 || 
                          displayedTasks[0]?.id !== newTask.id || 
                          displayedTasks[0]?.approval_status !== 'closed');
    
    console.log('🔍 任务关闭检测', {
      hasDisplayedTask: displayedTasks.length > 0,
      sameTask: displayedTasks[0]?.id === newTask.id,
      oldStatus: displayedTasks[0]?.approval_status,
      newStatus: newTask.approval_status,
      isTaskClosing
    });
    
    if (isTaskClosing) {
      console.log('✅ 任务关闭：显示结束语气泡');
      setShowApprovalButtons(false);
      setBubbleVisible(true);
      setIsTyping(true);
      
      // 先设置 displayedTasks 为当前任务（确保有数据）
      if (displayedTasks.length === 0 || displayedTasks[0]?.id !== newTask.id) {
        setDisplayedTasks([{
          ...newTask,
          displayDescription: newTask.description,
          displayResult: newTask.result || '',
          approval_status: 'closed'
        }]);
      }
      
      // 打字机效果显示结束语
      let index = 0;
      const closeText = '此间事了，你先退下吧';
      const interval = setInterval(() => {
        if (index < closeText.length) {
          setDisplayedTasks(prev => {
            if (prev.length === 0) return prev;
            return [{
              ...prev[0],
              displayDescription: closeText.substring(0, index + 1),
              displayResult: '',
              result: '',
              approval_status: 'closed'
            }];
          });
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          
          // 打字完成后 3 秒淡出，然后清空任务列表
          setTimeout(() => {
            setBubbleVisible(false);
            setTimeout(() => {
              setDisplayedTasks([]);
              setAnimationPhase('done');
            }, 1000);
          }, 3000);
        }
      }, 100);
      return;
    }
    
    // 如果任务已关闭，不处理其他逻辑
    if (newTask.approval_status === 'closed') {
      return;
    }
    
    const isNewTask = displayedTasks.length === 0 || displayedTasks[0]?.id !== newTask.id;
    
    // 检测 result 更新：result 内容变化了
    const isResultUpdated = displayedTasks.length > 0 && 
                          displayedTasks[0]?.id === newTask.id && 
                          newTask.result &&
                          displayedTasks[0]?.result !== newTask.result;
    
    console.log('🔍 isResultUpdated 检测', {
      isResultUpdated,
      hasDisplayedTask: displayedTasks.length > 0,
      sameTask: displayedTasks[0]?.id === newTask.id,
      hasNewResult: !!newTask.result,
      resultChanged: displayedTasks[0]?.result !== newTask.result,
      lastMessageRole: newTask.conversation_history?.[newTask.conversation_history.length - 1]?.role,
      conversationGrew: newTask.conversation_history?.length > displayedTasks[0]?.conversation_history?.length,
      currentAnimationPhase: animationPhase
    });
    
    // 新任务到达 - 从皇帝气泡开始
    if (isNewTask && newTask.description && !newTask.result) {
      console.log('新任务：显示皇帝气泡');
      const taskToDisplay = {
        ...newTask,
        displayDescription: '',
        displayResult: ''
      };
      setDisplayedTasks([taskToDisplay]);
      
      // 阶段 1：显示皇帝气泡（打字机效果）
      setBubbleVisible(true);
      setIsTyping(true);
      setThinkingState('none');
      setAnimationPhase('emperor_bubble');
      
      let descIndex = 0;
      const descInterval = setInterval(() => {
        if (descIndex < newTask.description.length) {
          setDisplayedTasks(prev => [{
            ...prev[0],
            displayDescription: newTask.description.substring(0, descIndex + 1)
          }]);
          descIndex++;
        } else {
          clearInterval(descInterval);
          setIsTyping(false);
          
          // 皇帝气泡打完后，等待 2 秒淡出
          setTimeout(() => {
            setBubbleVisible(false);
            
            // 淡出后进入 waiting_ai 阶段，显示 thinking
            setTimeout(() => {
              console.log('进入 waiting_ai 阶段');
              setAnimationPhase('waiting_ai');
              setThinkingState('thinking');
            }, 1000);
          }, 2000);
        }
      }, 50);
      return; // 处理完新任务就返回
    }
    
    // AI 回复到达 - 显示大臣气泡
    // 只要检测到 result 更新就显示动画
    if (isResultUpdated && newTask.result) {
      console.log('✅ AI 回复到达：继续动画流程', { 
        isEmperor, 
        currentAnimationPhase: animationPhase,
        resultLength: newTask.result.length,
        conversationLength: newTask.conversation_history?.length
      });
      
      // 隐藏审批按钮（如果之前显示了）
      setShowApprovalButtons(false);
      setBubbleVisible(false);
      
      // 更新 displayedTasks，包含完整的任务数据
      setDisplayedTasks([{
        ...newTask,
        displayDescription: displayedTasks[0]?.displayDescription || newTask.description,
        displayResult: '', // 开始时为空，打字机会逐步填充
        conversation_history: newTask.conversation_history
      }]);
      
      // 直接开始显示气泡和播放语音（函数内部会处理 thinking/idea 动画）
      showBubbleWithTyping(newTask);
      
      return; // 处理完回复就返回
    }
    
    // 显示气泡并打字的函数 - 先生成语音，再同步打字
    async function showBubbleWithTyping(task: any) {
      console.log('💬 准备显示气泡和播放语音');
      
      // 如果是皇帝视角，先生成语音
      if (isEmperor && task.assignee_id) {
        // 保持 thinking 动画，开始生成语音
        console.log('🤔 保持 thinking，开始生成语音');
        setThinkingState('thinking');
        setAnimationPhase('waiting_ai');
        
        // 生成并开始播放语音（会在 onplay 时 resolve）
        const audioStarted = await startPlayTTS(task.result, task.assignee_id);
        
        if (!audioStarted) {
          console.log('⚠️ 语音生成失败或被阻止');
          // 失败时显示 idea 1 秒再显示文字
          setThinkingState('idea');
          setAnimationPhase('ai_ready');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log('✅ 语音已开始播放，立即显示气泡');
          // 成功时立即显示气泡（不需要 idea 动画）
        }
      }
      
      // 显示气泡并开始打字
      console.log('💬 开始显示气泡和打字');
      setThinkingState('none');
      setAnimationPhase('minister_bubble');
      setBubbleVisible(true);
      setIsTyping(true);
      
      let resultIndex = 0;
      const resultInterval = setInterval(() => {
        if (resultIndex < task.result.length) {
          setDisplayedTasks(prev => [{
            ...prev[0],
            displayResult: task.result.substring(0, resultIndex + 1)
          }]);
          resultIndex++;
        } else {
          clearInterval(resultInterval);
          setIsTyping(false);
          console.log('✅ 气泡打字完成');
          
          // 打字完成后的处理
          const handleAfterTyping = async () => {
            if (isEmperor && task.assignee_id) {
              // 皇帝视角：等待语音播放完成
              console.log('🎵 打字完成，等待语音播放完成');
              await waitForAudioEnd();
              console.log('🎵 语音播放完成');
            } else {
              // 大臣视角：等待 3 秒
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // 淡出气泡
            setBubbleVisible(false);
            // 气泡淡出后再等 1 秒
            setTimeout(() => {
              if (isEmperor) {
                // 皇帝视角：显示审批按钮
                setShowApprovalButtons(true);
              }
              setAnimationPhase('done');
              console.log('✅ 动画流程完成');
            }, 1000);
          };
          
          handleAfterTyping();
        }
      }, 50);
    }
    
    // 同一个任务，只是状态改变（如批准、驳回）
    if (!isNewTask && !isResultUpdated && displayedTasks.length > 0 && displayedTasks[0]?.id === newTask.id) {
      // 检查是否有任何字段变化需要更新
      const needsUpdate = displayedTasks[0]?.approval_status !== newTask.approval_status ||
                         displayedTasks[0]?.status !== newTask.status ||
                         displayedTasks[0]?.conversation_history?.length !== newTask.conversation_history?.length;
      
      if (needsUpdate) {
        console.log('🔄 更新任务状态（非动画触发）', {
          oldApprovalStatus: displayedTasks[0]?.approval_status,
          newApprovalStatus: newTask.approval_status,
          oldStatus: displayedTasks[0]?.status,
          newStatus: newTask.status
        });
        
        setDisplayedTasks(prev => [{
          ...prev[0],
          ...newTask,
          displayDescription: prev[0].displayDescription,
          displayResult: prev[0].displayResult
        }]);
      }
    }
  }, [tasks, animationPhase]);

  const { data: rankingRes } = useQuery({
    queryKey: ['ranking', currentCourt?.id],
    queryFn: () => courtAPI.getRanking(currentCourt?.id),
    enabled: !!currentCourt,
    refetchInterval: 3000, // 每 3 秒自动刷新一次
  });

  // 获取文件列表
  const { data: filesRes, refetch: refetchFiles } = useQuery({
    queryKey: ['files'],
    queryFn: () => fileAPI.listOutputs(),
    enabled: showFilesModal,
  });

  // 初始化文件顺序
  useEffect(() => {
    if (filesRes?.data?.data) {
      setFileOrder(filesRes.data.data);
      // 默认选中第一个文件
      if (filesRes.data.data.length > 0 && !selectedFile) {
        setSelectedFile(filesRes.data.data[0]);
      }
    }
  }, [filesRes?.data?.data]);

  // 处理拖拽换位置
  const handleDragOver = (e: React.DragEvent, targetFile: any) => {
    e.preventDefault();
    if (!draggedFile || draggedFile.filename === targetFile.filename) return;

    const newOrder = [...fileOrder];
    const draggedIndex = newOrder.findIndex(f => f.filename === draggedFile.filename);
    const targetIndex = newOrder.findIndex(f => f.filename === targetFile.filename);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // 交换位置
      [newOrder[draggedIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[draggedIndex]];
      setFileOrder(newOrder);
    }
  };

  const ranking = rankingRes?.data.data || [];
  const emperor = ranking.find((m: any) => m.role === 'emperor');
  const ministers = ranking.filter((m: any) => m.role === 'minister');
  const isEmperor = emperor?.user_id === user?.id;
  
  // 当没有大臣时，调用 SecondMe 生成无聊提示语
  useEffect(() => {
    if (ministers.length === 0 && isEmperor && currentCourt && user?.id) {
      console.log('🤴 皇帝无聊模式启动，准备调用 SecondMe 生成提示语');
      
      // 随机 5-10 秒显示一次
      const showBoredMessage = async () => {
        try {
          console.log('📡 正在调用 SecondMe API 生成无聊提示语...');
          const response = await boredAPI.generateMessage(user.id);
          const fullMessage = response.data?.data?.message || '朕好无聊啊...';
          console.log('✅ SecondMe 返回消息:', fullMessage);
          
          // 打字机效果显示
          setBoredMessage('');
          setShowBoredBubble(true);
          
          let index = 0;
          const typingInterval = setInterval(() => {
            if (index < fullMessage.length) {
              setBoredMessage(fullMessage.substring(0, index + 1));
              index++;
            } else {
              clearInterval(typingInterval);
              // 打字完成后 3 秒隐藏
              setTimeout(() => {
                setShowBoredBubble(false);
              }, 3000);
            }
          }, 150); // 每 150ms 显示一个字，速度更慢更自然
          
        } catch (error) {
          console.error('❌ 生成无聊提示语失败:', error);
          // 失败时使用默认消息
          setBoredMessage('朕好无聊啊...');
          setShowBoredBubble(true);
          setTimeout(() => {
            setShowBoredBubble(false);
          }, 3000);
        }
      };
      
      // 首次延迟 2 秒显示
      const firstTimeout = setTimeout(showBoredMessage, 2000);
      
      // 之后每隔 5-10 秒随机显示
      const interval = setInterval(() => {
        const randomDelay = Math.floor(Math.random() * 5000) + 5000; // 5-10秒
        setTimeout(showBoredMessage, randomDelay);
      }, 10000); // 每 10 秒检查一次
      
      return () => {
        clearTimeout(firstTimeout);
        clearInterval(interval);
      };
    } else {
      console.log('⏸️ 无聊模式未启动:', { 
        ministers: ministers.length, 
        isEmperor, 
        hasCourt: !!currentCourt, 
        hasUserId: !!user?.id 
      });
    }
  }, [ministers.length, isEmperor, currentCourt?.id, user?.id]);
  
  // 检查当前用户在这个朝堂中是否设置了性别
  // 只有皇帝/皇后需要选择性别，大臣不需要
  const currentMember = ranking.find((m: any) => m.user_id === user?.id);
  const needsGenderSelection = currentMember && 
                                currentMember.role === 'emperor' && 
                                (!currentMember.gender || currentMember.gender === 'unknown');
  
  // 如果需要选择性别，显示性别选择弹窗
  useEffect(() => {
    if (needsGenderSelection && currentCourt?.id && !showGenderModal) {
      setShowGenderModal(true);
    }
  }, [needsGenderSelection, currentCourt?.id, showGenderModal]);
  
  // 处理性别选择提交
  const handleGenderSubmit = async () => {
    if (!currentCourt?.id || !user?.id) return;
    
    setIsSubmittingGender(true);
    try {
      await fetch(`https://backend-production-a216.up.railway.app/api/users/court-member/${currentCourt.id}/${user.id}/gender`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ gender: selectedGender }),
      });
      
      setShowGenderModal(false);
      showToast('性别设置成功！');
      // 刷新朝堂数据，不刷新整个页面
      await refetchCourts();
    } catch (error) {
      console.error('更新性别失败:', error);
      showToast('更新失败，请重试', 'error');
    } finally {
      setIsSubmittingGender(false);
    }
  };

  const handleCreateCourt = async () => {
    if (!courtName.trim()) {
      showToast('请输入朝堂名称', 'error');
      return;
    }

    setIsCreating(true);
    try {
      await courtAPI.create({
        name: courtName,
        description: courtDescription,
        user_id: user!.id,
      });
      setShowCreateModal(false);
      setCourtName('');
      setCourtDescription('');
      refetchCourts();
      showToast('朝堂创建成功！');
    } catch (error) {
      console.error('创建朝堂失败:', error);
      showToast('创建朝堂失败，请重试', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = () => {
    // 直接使用当前访问的地址生成邀请链接
    const link = `${window.location.origin}/join/${currentCourt?.id}`;
    setInviteLink(link);
    setShowInviteModal(true);
  };

  // 打开召唤分身弹窗
  const handleOpenSummonModal = async () => {
    if (!currentCourt?.id || !user?.id) return;
    
    try {
      const response = await courtAPI.getAvailableBots(currentCourt.id, user.id);
      setAvailableBots(response.data.data || []);
      setShowSummonModal(true);
    } catch (error) {
      console.error('获取可用人机列表失败:', error);
      showToast('获取分身列表失败', 'error');
    }
  };

  // 点击卡牌，开始翻牌动画（随机抽取）
  const handleCardClick = () => {
    // 从可用的人中随机选择一个
    const randomIndex = Math.floor(Math.random() * availableBots.length);
    const randomBot = availableBots[randomIndex];
    
    setSelectedBot(randomBot);
    setShowSummonModal(false);
    setShowCardFlip(true);
    
    // 开始翻牌动画
    setTimeout(() => {
      setIsFlipping(true);
    }, 100);
  };
  
  // 确认召唤
  const handleConfirmSummon = async () => {
    if (!selectedBot || !currentCourt?.id) return;
    
    setIsSummoning(true);
    try {
      await courtAPI.summonBot(currentCourt.id, selectedBot.id);
      showToast(`已招募 ${selectedBot.nickname} 入朝为官`);
      setShowCardFlip(false);
      setIsFlipping(false);
      setSelectedBot(null);
      // 刷新朝堂成员列表，不刷新整个页面
      await refetchCourts();
    } catch (error: any) {
      console.error('招募贤士失败:', error);
      if (error.response?.data?.error?.includes('duplicate')) {
        showToast('该贤士已在朝堂中', 'error');
      } else {
        showToast('招募失败，请重试', 'error');
      }
      setShowCardFlip(false);
      setIsFlipping(false);
      setSelectedBot(null);
    } finally {
      setIsSummoning(false);
    }
  };
  
  // 取消召唤
  const handleCancelSummon = () => {
    setShowCardFlip(false);
    setIsFlipping(false);
    setSelectedBot(null);
    setShowSummonModal(true);
  };

  // 场景数据 - 每个场景需要的幸福值递增
  const scenes = [
    { id: 'default', name: '初始', image: bgImage, description: '朝堂初景，万象更新', requiredHappiness: 0 },
    { id: 'huaxia', name: '华夏', image: huaxiaScene, description: '中原大地，繁华盛世', requiredHappiness: 100 },
    { id: 'dongying', name: '东瀛', image: dongyingScene, description: '海岛之国，樱花烂漫', requiredHappiness: 200 },
    { id: 'gaoli', name: '高丽', image: gaoliScene, description: '半岛之邦，文化璀璨', requiredHappiness: 350 },
    { id: 'annan', name: '安南', image: annanScene, description: '南国风情，物产丰饶', requiredHappiness: 550 },
    { id: 'xianluo', name: '暹罗', image: xianluoScene, description: '热带王国，佛塔林立', requiredHappiness: 800 },
    { id: 'dashi', name: '大食', image: dashiScene, description: '西域明珠，商贾云集', requiredHappiness: 1100 },
  ];
  
  // 获取当前场景和下一个场景
  const currentScene = scenes[currentSceneIndex];
  const nextScene = currentSceneIndex < scenes.length - 1 ? scenes[currentSceneIndex + 1] : null;
  
  // 计算当前场景的进度（0-100）
  const getCurrentProgress = () => {
    if (!nextScene) return 100; // 已经是最后一个场景
    const currentRequired = currentScene.requiredHappiness;
    const nextRequired = nextScene.requiredHappiness;
    const range = nextRequired - currentRequired;
    const progress = ((happiness - currentRequired) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  // 获取百姓状态图片
  const getPeopleImage = () => {
    const progress = getCurrentProgress();
    if (progress < 20) return qiongImage;
    if (progress < 40) return qiangImage;
    return fuImage;
  };
  
  // 检查是否可以解锁下一个场景
  const canUnlockNext = getCurrentProgress() >= 100 && nextScene && !unlockedScenes.includes(nextScene.id);

  // 增加幸福值（每次对话）
  const addHappiness = async () => {
    if (!currentCourt?.id || !user?.id) {
      console.warn('⚠️ 无法增加幸福值：缺少 courtId 或 userId');
      return;
    }
    
    const increment = Math.floor(Math.random() * 11) + 10; // 10-20 随机
    
    try {
      console.log(`💖 正在增加幸福值 +${increment}...`);
      const response = await territoryAPI.updateHappiness(
        currentCourt.id,
        user.id,
        increment,
        'task_interaction',
        '与大臣交互'
      );
      
      setHappiness(response.data.happiness);
      console.log(`✅ 幸福值更新成功，当前: ${response.data.happiness}`);
    } catch (error: any) {
      console.error('❌ 更新幸福值失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // 失败时使用本地更新作为降级方案
      const newHappiness = happiness + increment;
      setHappiness(newHappiness);
      console.log(`⚠️ 使用本地降级方案，当前: ${newHappiness}`);
    }
  };
  
  // 打开疆土拓展弹窗
  const handleOpenTerritory = () => {
    // 显示所有场景（包括未解锁的）
    setAvailableScenes(scenes);
    setShowTerritoryModal(true);
  };
  
  // 解锁下一个场景（不再直接使用，改为通过征战视频解锁）
  const handleUnlockNextScene = () => {
    if (!nextScene) return;
    
    setSelectedScene(nextScene);
    setShowTerritoryModal(false);
    setShowSceneCardFlip(true);
    
    // 开始翻牌动画
    setTimeout(() => {
      setIsFlippingScene(true);
    }, 100);
  };
  
  // 开始征战（播放视频）
  const handleStartConquest = () => {
    setShowSceneCardFlip(false);
    setShowConquestVideo(true);
    setIsConquesting(true);
  };
  
  // 征战完成（视频播放结束）
  const handleConquestComplete = async () => {
    if (!selectedScene || !currentCourt?.id || !user?.id) return;
    
    try {
      // 解锁场景
      const unlockResponse = await territoryAPI.unlockScene(currentCourt.id, user.id, selectedScene.id);
      setUnlockedScenes(unlockResponse.data.unlockedScenes);
      
      // 切换到新场景
      await territoryAPI.switchScene(currentCourt.id, user.id, selectedScene.id);
      setCurrentBackground(selectedScene.id);
      
      // 更新当前场景索引
      const newIndex = scenes.findIndex(s => s.id === selectedScene.id);
      setCurrentSceneIndex(newIndex);
      
      showToast(`${selectedScene.name}已被征服！`);
    } catch (error) {
      console.error('征战完成处理失败:', error);
      showToast('征战失败，请重试', 'error');
    } finally {
      // 关闭视频
      setShowConquestVideo(false);
      setIsConquesting(false);
      setIsFlippingScene(false);
      setSelectedScene(null);
    }
  };

  // 点击场景卡牌，开始翻牌动画
  const handleSceneCardClick = (scene: any) => {
    setSelectedScene(scene);
    setShowTerritoryModal(false);
    setShowSceneCardFlip(true);
    
    // 开始翻牌动画
    setTimeout(() => {
      setIsFlippingScene(true);
    }, 100);
  };

  // 确认切换场景
  const handleConfirmScene = async () => {
    if (!selectedScene || !currentCourt?.id || !user?.id) return;
    
    try {
      // 如果是解锁新场景
      if (!unlockedScenes.includes(selectedScene.id)) {
        const unlockResponse = await territoryAPI.unlockScene(currentCourt.id, user.id, selectedScene.id);
        setUnlockedScenes(unlockResponse.data.unlockedScenes);
        
        // 更新当前场景索引
        const newIndex = scenes.findIndex(s => s.id === selectedScene.id);
        setCurrentSceneIndex(newIndex);
        
        showToast(`已解锁${selectedScene.name}！`);
      } else {
        showToast(`已切换至${selectedScene.name}场景`);
      }
      
      // 切换场景
      await territoryAPI.switchScene(currentCourt.id, user.id, selectedScene.id);
      setCurrentBackground(selectedScene.id);
    } catch (error) {
      console.error('切换场景失败:', error);
      showToast('切换场景失败，请重试', 'error');
    } finally {
      setShowSceneCardFlip(false);
      setIsFlippingScene(false);
      setSelectedScene(null);
    }
  };

  // 取消切换场景
  const handleCancelScene = () => {
    setShowSceneCardFlip(false);
    setIsFlippingScene(false);
    setSelectedScene(null);
    setShowTerritoryModal(true);
  };

  // 从 API 加载疆土拓展数据
  useEffect(() => {
    const loadTerritoryData = async () => {
      if (!currentCourt?.id || !user?.id) return;
      
      try {
        const response = await territoryAPI.get(currentCourt.id, user.id);
        const data = response.data;
        
        setHappiness(data.happiness || 0);
        setUnlockedScenes(data.unlockedScenes || ['default']);
        setCurrentBackground(data.currentScene || 'default');
        
        // 更新当前场景索引
        const sceneIndex = scenes.findIndex(s => s.id === data.currentScene);
        if (sceneIndex >= 0) {
          setCurrentSceneIndex(sceneIndex);
        }
      } catch (error) {
        console.error('加载疆土拓展数据失败:', error);
        // 使用默认值
        setHappiness(0);
        setUnlockedScenes(['default']);
        setCurrentBackground('default');
        setCurrentSceneIndex(0);
      }
    };
    
    loadTerritoryData();
  }, [currentCourt?.id, user?.id]);

  // 获取当前背景图片
  const getCurrentBackgroundImage = () => {
    const scene = scenes.find(s => s.id === currentBackground);
    return scene?.image || huaxiaScene;
  };

  const copyInviteLink = async () => {
    try {
      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteLink);
        showToast('邀请链接已复制！');
        setShowInviteModal(false);
      } else {
        // 降级方案：使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          showToast('邀请链接已复制！');
          setShowInviteModal(false);
        } catch (err) {
          console.error('复制失败:', err);
          showToast('复制失败，请手动复制', 'error');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('复制链接失败:', error);
      showToast('复制失败，请手动复制', 'error');
    }
  };

  const handleAssignTask = (minister: any) => {
    if (!isEmperor) {
      showToast('只有皇帝才能发布圣旨！', 'error');
      return;
    }
    setSelectedSlave(minister);
    setShowTaskModal(true);
  };

  const handleCreateTask = async () => {
    if (!taskDescription.trim()) {
      showToast('请填写任务内容', 'error');
      return;
    }

    if (!selectedSlave) {
      showToast('请先选择要派发任务的大臣', 'error');
      return;
    }

    try {
      // 关闭输入弹窗
      setShowTaskModal(false);
      
      // 开始动画流程：第一阶段 - 皇帝气泡
      setAnimationPhase('emperor_bubble');
      
      // 使用描述的前 50 个字符作为标题
      const title = taskDescription.trim().substring(0, 50) + (taskDescription.length > 50 ? '...' : '');
      
      await taskAPI.create({
        court_id: currentCourt.id,
        emperor_id: user!.id,
        assignee_id: selectedSlave.user_id,
        title: title,
        description: taskDescription,
        task_type: 'brain',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      
      // 增加幸福值
      await addHappiness();
      
      setTaskDescription('');
      setSelectedSlave(null);
      refetchTasks();
      showToast('圣旨已下达！');
      
    } catch (error) {
      console.error('发布任务失败:', error);
      showToast('发布任务失败，请重试', 'error');
      setAnimationPhase('done');
      setThinkingState('none');
    }
  };

  const handleDestroyCourt = async () => {
    try {
      await courtAPI.destroy(currentCourt.id, user!.id);
      showToast('王朝已覆灭');
      // 刷新朝堂列表，不刷新整个页面
      await refetchCourts();
      // 清除当前朝堂 ID
      localStorage.removeItem('currentCourtId');
      setCurrentCourtId(null);
    } catch (error) {
      console.error('覆灭王朝失败:', error);
      showToast('操作失败，请重试', 'error');
    }
  };

  const handleLeaveCourt = async () => {
    try {
      await courtAPI.leave(currentCourt.id, user!.id);
      showToast('告老还乡成功');
      // 刷新朝堂列表，不刷新整个页面
      await refetchCourts();
      // 清除当前朝堂 ID
      localStorage.removeItem('currentCourtId');
      setCurrentCourtId(null);
    } catch (error) {
      console.error('退出朝堂失败:', error);
      showToast('操作失败，请重试', 'error');
    }
  };

  // 结束对话
  const handleCloseTask = async (taskId: string) => {
    console.log('🔚 点击结按钮', { 
      taskId, 
      displayedTasksLength: displayedTasks.length,
      displayedTaskId: displayedTasks[0]?.id,
      displayedTaskStatus: displayedTasks[0]?.approval_status
    });
    
    setShowApprovalButtons(false); // 立即隐藏按钮
    
    try {
      await taskAPI.closeTask(taskId);
      showToast('对话已结束');
      refetchTasks(); // 刷新任务列表，触发 useEffect 显示"此间事了"气泡
    } catch (error) {
      console.error('结束对话失败:', error);
      showToast('操作失败，请重试', 'error');
    }
  };

  // 准奏
  const handleApproveTask = async () => {
    setShowApprovalButtons(false);
    setShowApproveModal(false);
    
    // 立即进入 thinking 状态
    setBubbleVisible(false);
    setAnimationPhase('waiting_ai');
    setThinkingState('thinking');
    console.log('🎯 准奏：立即显示 thinking');
    
    try {
      await taskAPI.approveTask(selectedTaskForApproval.id, approvalFeedback);
      
      // 增加幸福值
      await addHappiness();
      
      showToast('已准奏');
      setApprovalFeedback('');
      setSelectedTaskForApproval(null);
      refetchTasks();
    } catch (error) {
      console.error('准奏失败:', error);
      showToast('操作失败，请重试', 'error');
      setAnimationPhase('done');
      setThinkingState('none');
    }
  };

  // 驳回
  const handleRejectTask = async () => {
    if (!rejectionReason.trim()) {
      showToast('请输入驳回理由', 'error');
      return;
    }

    setShowApprovalButtons(false);
    setShowRejectModal(false);
    
    // 立即进入 thinking 状态
    setBubbleVisible(false);
    setAnimationPhase('waiting_ai');
    setThinkingState('thinking');
    console.log('🎯 驳回：立即显示 thinking');
    
    try {
      await taskAPI.rejectTask(selectedTaskForRejection.id, rejectionReason);
      
      // 增加幸福值
      await addHappiness();
      
      showToast('已驳回，大臣将重新设计方案');
      setRejectionReason('');
      setSelectedTaskForRejection(null);
      refetchTasks();
    } catch (error) {
      console.error('驳回失败:', error);
      showToast('操作失败，请重试', 'error');
      setAnimationPhase('done');
      setThinkingState('none');
    }
  };

  // 惩罚大臣
  const handlePunishMinister = async () => {
    if (!punishmentContent.trim()) {
      showToast('请输入惩罚内容', 'error');
      return;
    }

    if (!selectedTaskForPunishment || !currentCourt?.id || !user?.id) {
      showToast('参数错误', 'error');
      return;
    }

    // 确保获取正确的 user_id
    const ministerId = selectedTaskForPunishment.user_id || selectedTaskForPunishment.user?.id;
    
    if (!ministerId) {
      showToast('无法获取大臣 ID', 'error');
      return;
    }

    // 关闭弹窗，显示求饶动画
    setShowPunishModal(false);
    setShowPunishmentAnimation(true);
    
    try {
      const response = await taskAPI.punishMinister(
        currentCourt.id,
        ministerId, // 大臣 ID
        user.id, // 皇帝 ID
        punishmentContent
      );
      
      // 获取生成的内容
      const generatedContent = response.data?.data?.content || '惩罚已执行';
      setGeneratedPunishmentText(generatedContent);
      
      // 隐藏求饶动画，显示生成的内容
      setShowPunishmentAnimation(false);
      setShowPunishmentResult(true);
      
      showToast('惩罚已执行，大臣已在广场发布');
      setPunishmentContent('');
      setSelectedTaskForPunishment(null);
    } catch (error: any) {
      console.error('惩罚失败:', error);
      console.error('错误详情:', error.response?.data);
      
      // 隐藏动画
      setShowPunishmentAnimation(false);
      
      if (error.response?.data?.message?.includes('Plaza access required')) {
        showToast('该大臣尚未激活 Plaza 准入', 'error');
      } else {
        showToast('惩罚失败，请重试', 'error');
      }
    }
  };

  // 发送悄悄话
  const handleSendWhisper = async () => {
    if (!whisperMessage.trim()) {
      showToast('请输入内容', 'error');
      return;
    }

    if (!whisperTarget || !currentCourt?.id || !user?.id) {
      showToast('参数错误', 'error');
      return;
    }

    console.log('🗣️ 发送悄悄话', {
      from: user.id,
      to: whisperTarget.user_id || whisperTarget.user?.id,
      message: whisperMessage
    });

    // 关闭弹窗，开始显示气泡动画
    setShowWhisperModal(false);
    setWhisperPhase('message_bubble');
    setDisplayedWhisperMessage('');
    setDisplayedWhisperReply('');
    setIsWhisperTyping(true);
    
    // 打字机效果显示发送的消息
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      if (msgIndex < whisperMessage.length) {
        setDisplayedWhisperMessage(whisperMessage.substring(0, msgIndex + 1));
        msgIndex++;
      } else {
        clearInterval(msgInterval);
        setIsWhisperTyping(false);
        
        // 消息打完后等待2秒，然后调用API
        setTimeout(async () => {
          setWhisperPhase('waiting_reply');
          
          try {
            const targetUserId = whisperTarget.user_id || whisperTarget.user?.id;
            console.log('📡 调用悄悄话 API', { targetUserId });
            
            const response = await whisperAPI.send(
              currentCourt.id,
              user.id,
              targetUserId,
              whisperMessage
            );
            
            console.log('✅ 悄悄话 API 响应', response.data);
            
            // 获取生成的回复
            const replyContent = response.data?.data?.parsed_content?.reply || '';
            console.log('💬 AI 生成的回复', replyContent);
            
            setCurrentWhisper({
              ...response.data?.data,
              from_user_id: user.id,
              to_user_id: targetUserId,
              message: whisperMessage,
              reply: replyContent
            });
            
            // 开始显示回复气泡
            setWhisperPhase('reply_bubble');
            setDisplayedWhisperReply('');
            
            // 打字机效果显示回复
            let replyIndex = 0;
            const replyInterval = setInterval(() => {
              if (replyIndex < replyContent.length) {
                setDisplayedWhisperReply(replyContent.substring(0, replyIndex + 1));
                replyIndex++;
              } else {
                clearInterval(replyInterval);
                
                // 回复打完后等待3秒，然后淡出
                setTimeout(() => {
                  console.log('✅ 悄悄话动画完成');
                  setWhisperPhase('done');
                  setWhisperMessage('');
                  setWhisperTarget(null);
                  setCurrentWhisper(null);
                  setDisplayedWhisperMessage('');
                  setDisplayedWhisperReply('');
                }, 3000);
              }
            }, 50);
            
            showToast('悄悄话已发送');
          } catch (error: any) {
            console.error('❌ 发送悄悄话失败:', error);
            setWhisperPhase('done');
            showToast('发送失败，请重试', 'error');
          }
        }, 2000);
      }
    }, 50);
  };

  // 如果没有朝堂，显示游戏介绍页面
  if (!currentCourt) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* 背景视频 */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: -1 }}
        >
          <source src={bgVideo} type="video/mp4" />
          <img src={bgImage} alt="background" className="absolute inset-0 w-full h-full object-cover" />
        </video>
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" style={{ zIndex: 0 }}></div>
        
        {/* 内容层 */}
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6" style={{ zIndex: 1 }}>
          {/* 游戏标题 */}
          <div className="text-center mb-16 animate-fadeInUp">
            <h1 className="text-8xl font-bold mb-6 text-chinese-title text-white animate-float" 
                style={{ 
                  textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  letterSpacing: '0.2em'
                }}>
              一日朝堂
            </h1>
            <p className="text-2xl text-white/90 text-chinese-elegant tracking-widest" 
               style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              SecondMe 虚拟分身驱动的古风策略游戏
            </p>
          </div>
          
          {/* 游戏介绍卡片 */}
          <div className="max-w-5xl w-full grid grid-cols-3 gap-6 mb-16 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            {/* 游戏背景 */}
            <div className="bg-black/40 rounded-2xl p-8 border border-amber-500/30 hover:border-amber-500/60 transition-all hover:scale-105 transform">
              <h3 className="text-2xl font-bold text-amber-400 mb-4 text-chinese-title text-center">游戏背景</h3>
              <p className="text-amber-100/80 leading-relaxed text-chinese-elegant text-center">
                成为一代明君，建立朝堂，招募大臣。每位大臣由 SecondMe 虚拟分身驱动，拥有独特性格，会根据你的决策产生不同反应。
              </p>
            </div>
            
            {/* 核心玩法 */}
            <div className="bg-black/40 rounded-2xl p-8 border border-amber-500/30 hover:border-amber-500/60 transition-all hover:scale-105 transform">
              <h3 className="text-2xl font-bold text-amber-400 mb-4 text-chinese-title text-center">核心玩法</h3>
              <div className="space-y-3 text-amber-100/80 text-chinese-elegant">
                <p className="text-center">下达圣旨，分配任务</p>
                <p className="text-center">准驳方案，影响怨气</p>
                <p className="text-center">管理情绪，平衡朝堂</p>
              </div>
            </div>
            
            {/* 游戏特色 */}
            <div className="bg-black/40 rounded-2xl p-8 border border-amber-500/30 hover:border-amber-500/60 transition-all hover:scale-105 transform">
              <h3 className="text-2xl font-bold text-amber-400 mb-4 text-chinese-title text-center">游戏特色</h3>
              <div className="space-y-3 text-amber-100/80 text-chinese-elegant">
                <p className="text-center">SecondMe 虚拟分身对话</p>
                <p className="text-center">多人协作角色扮演</p>
                <p className="text-center">动态情绪反馈机制</p>
              </div>
            </div>
          </div>
          
          {/* 开始游戏按钮 */}
          <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-5 px-16 rounded-full shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-110 text-2xl btn-imperial text-chinese-elegant animate-pulse-glow"
              style={{ 
                letterSpacing: '0.3em',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}
            >
              开创基业
            </button>
            <p className="text-amber-200/60 text-sm mt-6 text-chinese-elegant tracking-wider">
              点击按钮创建朝堂，开启你的帝王之路
            </p>
          </div>
        </div>

        {/* 创建朝堂弹窗 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-amber-400 animate-scaleIn">
              <h2 className="text-3xl font-bold text-amber-900 mb-6 text-chinese-title text-center text-gold-gradient">
                开创基业
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-base font-bold text-amber-800 mb-2 text-chinese-elegant">
                    朝堂名称
                  </label>
                  <input
                    type="text"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    placeholder="例如：兄弟朝堂"
                    className="w-full px-5 py-3 border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white/80 text-chinese-elegant"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-amber-800 mb-2 text-chinese-elegant">
                    朝堂简介
                  </label>
                  <textarea
                    value={courtDescription}
                    onChange={(e) => setCourtDescription(e.target.value)}
                    placeholder="介绍一下你的朝堂..."
                    rows={3}
                    className="w-full px-5 py-3 border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none bg-white/80 text-chinese-elegant"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-amber-400 rounded-xl hover:bg-amber-100 font-bold transition-all text-amber-800 text-chinese-elegant"
                  disabled={isCreating}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateCourt}
                  disabled={isCreating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl disabled:opacity-50 font-bold transition-all shadow-lg text-chinese-elegant"
                >
                  {isCreating ? '创建中...' : '开创'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 朝堂主界面 - 使用图片资源
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${getCurrentBackgroundImage()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 顶部进度条 - 疆土拓展 */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
        <div 
          onClick={handleOpenTerritory}
          className="cursor-pointer group"
        >
          {/* 疆土拓展标题 - 独立一行 */}
          <div className="text-center mb-1.5">
            <span className="text-amber-900 font-bold text-base text-chinese-title text-gold-gradient">
              疆土拓展
            </span>
          </div>
          
          {/* 进度条容器 - 所有元素水平对齐 */}
          <div className="flex items-center gap-2">
            {/* 左侧：百姓状态图片 - 使用固定高度与进度条对齐 */}
            <div className="w-10 h-5 flex items-center justify-center flex-shrink-0">
              <img 
                src={getPeopleImage()} 
                alt="百姓状态" 
                className="w-10 h-10 object-contain drop-shadow-lg"
              />
            </div>
            
            {/* 中间：进度条 */}
            <div className={`relative h-5 bg-black/50 backdrop-blur-sm rounded-full overflow-hidden border ${canUnlockNext ? 'border-yellow-400 animate-pulse-glow' : 'border-yellow-600/60 group-hover:border-yellow-400'} transition-all shadow-lg`} style={{ width: '260px' }}>
              {/* 进度填充 */}
              <div 
                className={`absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 transition-all duration-500 ${canUnlockNext ? 'animate-pulse' : 'group-hover:from-yellow-400 group-hover:via-amber-400 group-hover:to-orange-400'}`}
                style={{ width: `${getCurrentProgress()}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
              
              {/* 进度文字 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-chinese-elegant">
                  百姓幸福度：{Math.floor(getCurrentProgress())}%
                </span>
              </div>
            </div>
            
            {/* 右侧：下一个国家名字（达到100时显示） - 高度与进度条一致 */}
            {canUnlockNext && nextScene && (
              <div className="flex-shrink-0 h-5 flex items-center px-2.5 bg-black/50 backdrop-blur-sm rounded-full animate-pulse">
                <span className="text-yellow-300 text-xs font-bold text-chinese-elegant drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  → {nextScene.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 左上角按钮 - 邀请好友和退出 */}
      <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
        <button
          onClick={handleOpenSummonModal}
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-amber-900 px-5 py-2 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all border-2 border-amber-400 text-chinese-elegant text-base animate-slideInLeft"
          style={{ animationDelay: '0.1s' }}
        >
          招贤纳士
        </button>
        
        <button
          onClick={handleInvite}
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-amber-900 px-5 py-2 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all border-2 border-amber-400 text-chinese-elegant text-base animate-slideInLeft"
          style={{ animationDelay: '0.15s' }}
        >
          广发英雄帖
        </button>
        
        <button
          onClick={() => setShowFilesModal(true)}
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-amber-900 px-5 py-2 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all border-2 border-amber-400 text-chinese-elegant text-base animate-slideInLeft"
          style={{ animationDelay: '0.2s' }}
        >
          档案阁
        </button>
        
        {/* 退出按钮 - 皇帝显示"退位让贤"，大臣显示"告老还乡" */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-red-600 px-5 py-2 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all border-2 border-amber-400 text-chinese-elegant text-base animate-slideInLeft"
          style={{ animationDelay: '0.3s' }}
        >
          {isEmperor ? '退位让贤' : '告老还乡'}
        </button>
      </div>

      {/* 右上角 - 重生转世 */}
      {courts?.data.data && courts.data.data.length > 1 && (
        <div className="absolute top-20 right-6 z-10">
          <div className="relative">
            {/* 重生转世按钮 - 白色半透明背景 */}
            <button
              onClick={() => setShowCourtDropdown(!showCourtDropdown)}
              className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-amber-900 px-5 py-2 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all border-2 border-amber-400 text-chinese-elegant text-base animate-slideInRight flex items-center gap-2 min-w-[160px] justify-between"
            >
              <span>重生转世</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${showCourtDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* 展开的朝堂列表 */}
            {showCourtDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-white/90 backdrop-blur-sm border-2 border-amber-400 rounded-2xl shadow-xl overflow-hidden animate-scaleIn min-w-[160px]">
                {courts.data.data.map((court: any, index: number) => (
                  <button
                    key={court.id}
                    onClick={() => {
                      setCurrentCourtId(court.id);
                      localStorage.setItem('currentCourtId', court.id);
                      setShowCourtDropdown(false);
                      // 不刷新页面，直接切换朝堂
                    }}
                    className={`w-full px-4 py-2 text-left font-bold transition-all text-chinese-elegant text-sm ${
                      court.id === currentCourt?.id
                        ? 'bg-amber-400/30 text-amber-900'
                        : 'text-amber-900 hover:bg-amber-100/50'
                    } ${index !== courts.data.data.length - 1 ? 'border-b border-amber-200' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {court.id === currentCourt?.id && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>{court.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 左下角怨气值 */}
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-xl p-3 shadow-lg z-10 min-w-[200px] border border-amber-200 animate-fadeInUp">
        <h3 className="text-amber-900 font-bold text-lg mb-2 text-chinese-title text-gold-gradient">怨气值</h3>
        {ministers.slice(0, 3).map((m: any, i: number) => (
          <div 
            key={m.id} 
            className="flex items-center gap-2 mb-2 p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer transition-all animate-fadeInUp group"
            style={{ animationDelay: `${i * 0.1}s` }}
            onClick={() => {
              if (isEmperor) {
                setSelectedTaskForPunishment(m);
                setShowPunishModal(true);
              }
            }}
          >
            {/* 头像 */}
            <div className="relative">
              {m.user?.avatar ? (
                <img
                  src={m.user.avatar}
                  alt={m.user.nickname}
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-400 group-hover:border-amber-600 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold border-2 border-amber-400 group-hover:border-amber-600 transition-all">
                  {m.user?.nickname?.charAt(0) || '?'}
                </div>
              )}
              {/* 怨气值标记 */}
              {m.grudge_value > 80 && (
                <div className="absolute -top-1 -right-1 text-sm animate-bounce">😤</div>
              )}
            </div>
            
            {/* 名字和怨气值 */}
            <div className="flex-1">
              <div className="text-amber-900 font-bold text-sm text-chinese-elegant group-hover:text-amber-700">
                {m.user?.nickname || '未知'}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-xs">怨气:</span>
                <span className={m.grudge_value > 80 ? 'text-red-600 font-bold animate-pulse text-xs' : 'text-yellow-600 font-medium text-xs'}>
                  {m.grudge_value}
                </span>
              </div>
            </div>
            
            {/* 惩罚图标提示（仅皇帝可见） */}
            {isEmperor && (
              <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm text-chinese-elegant">
                罚
              </div>
            )}
          </div>
        ))}
        {ministers.length === 0 && (
          <div className="text-gray-500 text-xs text-chinese-elegant">暂无大臣</div>
        )}
      </div>

      {/* 中央区域 - 使用绝对定位固定皇上和太监的位置 */}
      <div className="relative min-h-screen">
        {/* 皇帝/皇后 - 坐在龙椅上的位置 */}
        {emperor && (
          <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: '40vh' }}>
            {/* 皇帝的任务气泡 - 显示任务描述或驳回理由 */}
            {tasks.length > 0 && displayedTasks[0]?.displayDescription && !displayedTasks[0]?.displayResult && (
              <div 
                className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-cyan-400 rounded-3xl shadow-lg w-80 z-20 transition-opacity duration-1000 ${bubbleVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ marginLeft: '-60px', maxHeight: '80px' }}
              >
                {/* 气泡内容区域 - 固定高度，内容可滚动 */}
                <div 
                  ref={(el) => {
                    if (el && isTyping) {
                      el.scrollTop = el.scrollHeight;
                    }
                  }}
                  className="p-3 overflow-y-auto scrollbar-thin" 
                  style={{ maxHeight: '80px' }}
                >
                  <p className="text-white text-xs whitespace-pre-wrap leading-relaxed">
                    {cleanContent(displayedTasks[0]?.displayDescription || '')}
                    {isTyping && displayedTasks[0]?.displayDescription && (
                      <span className="animate-pulse">|</span>
                    )}
                  </p>
                </div>
                {/* 气泡尾巴 */}
                <div className="absolute bottom-0 transform translate-y-full" style={{ left: '70%' }}>
                  <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-cyan-400"></div>
                </div>
              </div>
            )}
            
            {/* 无聊提示气泡 - 当没有大臣时显示 */}
            {ministers.length === 0 && showBoredBubble && (
              <div 
                className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-amber-400 rounded-3xl shadow-lg w-80 z-20 transition-opacity duration-500 ${showBoredBubble ? 'opacity-100' : 'opacity-0'}`}
                style={{ marginLeft: '-60px' }}
              >
                <div className="p-3">
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed text-chinese-elegant">
                    {boredMessage}
                  </p>
                </div>
                {/* 气泡尾巴 */}
                <div className="absolute bottom-0 transform translate-y-full" style={{ left: '70%' }}>
                  <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-amber-400"></div>
                </div>
              </div>
            )}
            
            <img
              src={emperor.gender === 'female' ? queenImage : kingImage}
              alt="Emperor"
              className="w-48 h-48 object-contain drop-shadow-2xl relative z-10"
            />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border-2 border-amber-400 z-10 whitespace-nowrap">
              <p className="text-amber-900 font-bold text-sm">{emperor.user.nickname}</p>
            </div>
          </div>
        )}

        {/* 奴才们的位置 */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-8 items-end justify-center" style={{ 
          top: '75vh',
          padding: '20px',
          minHeight: '150px',
          minWidth: '600px'
        }}>
          {ministers.length > 0 ? (
            ministers.slice(0, 4).map((minister: any) => (
              <div
                key={minister.id}
                className="relative cursor-pointer transform hover:scale-110 transition-transform duration-200"
                onClick={() => {
                  // 如果是皇帝，点击太监发布圣旨
                  if (isEmperor) {
                    handleAssignTask(minister);
                  } else {
                    // 如果是大臣，点击其他大臣说悄悄话
                    if (minister.user_id !== user?.id) {
                      setWhisperTarget(minister);
                      setShowWhisperModal(true);
                    }
                  }
                }}
              >
                {/* Thinking 和 Idea 动画 - 显示在大臣左上方，更靠近大臣 */}
                {thinkingState !== 'none' && 
                 tasks.length > 0 && 
                 displayedTasks[0]?.assignee_id === minister.user_id && (
                  <div className="absolute z-50 pointer-events-none" style={{ 
                    left: '-30px',
                    top: '-40px'
                  }}>
                    <img
                      src={thinkingState === 'thinking' ? thinkingGif : ideaGif}
                      alt={thinkingState === 'thinking' ? 'Thinking' : 'Idea'}
                      className="w-20 h-20 object-contain drop-shadow-xl animate-bounce"
                    />
                  </div>
                )}
                
                {/* 悄悄话消息气泡 - 发送者的消息，显示在发送者头上 */}
                {(whisperPhase === 'message_bubble' || whisperPhase === 'waiting_reply') && 
                 displayedWhisperMessage && 
                 minister.user_id === user?.id && (
                  <div className="absolute bg-purple-400 rounded-3xl shadow-lg z-30" style={{ 
                    top: '-140px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '280px'
                  }}>
                    <div className="p-3">
                      <p className="text-purple-100 text-xs whitespace-pre-wrap leading-relaxed">
                        <span className="text-yellow-300 font-bold">【悄悄话】</span>
                        <br />
                        {displayedWhisperMessage}
                        {isWhisperTyping && (
                          <span className="animate-pulse">|</span>
                        )}
                      </p>
                    </div>
                    {/* 气泡尾巴 */}
                    <div className="absolute bottom-0 left-1/2 transform translate-y-full -translate-x-1/2">
                      <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-purple-400"></div>
                    </div>
                  </div>
                )}
                
                {/* 悄悄话回复气泡 - 接收者的回复，显示在接收者头上 */}
                {whisperPhase === 'reply_bubble' && 
                 currentWhisper && 
                 displayedWhisperReply && 
                 (currentWhisper.to_user_id === minister.user_id || currentWhisper.to_user?.id === minister.user_id) && (
                  <div className="absolute bg-pink-400 rounded-3xl shadow-lg z-30" style={{ 
                    top: '-140px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '280px'
                  }}>
                    <div className="p-3">
                      <p className="text-pink-100 text-xs whitespace-pre-wrap leading-relaxed">
                        <span className="text-yellow-300 font-bold">【回复】</span>
                        <br />
                        {displayedWhisperReply}
                      </p>
                    </div>
                    {/* 气泡尾巴 */}
                    <div className="absolute bottom-0 left-1/2 transform translate-y-full -translate-x-1/2">
                      <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-pink-400"></div>
                    </div>
                  </div>
                )}
                
                {/* 大臣的回复气泡 - 只在有回复且是当前任务的大臣时显示 */}
                {tasks.length > 0 && displayedTasks[0]?.displayResult && displayedTasks[0]?.assignee_id === minister.user_id && (
                  <>
                    <div 
                      className={`absolute -top-32 left-1/2 transform -translate-x-1/2 bg-cyan-400 rounded-3xl shadow-lg w-80 z-30 transition-opacity duration-1000 ${bubbleVisible ? 'opacity-100' : 'opacity-0'}`}
                      style={{ maxHeight: '120px' }}
                    >
                      {/* 音频生成中指示器 */}
                      {isGeneratingAudio && isEmperor && (
                        <div className="absolute -top-8 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1 animate-pulse">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          生成中
                        </div>
                      )}
                      
                      {/* 音频播放指示器 */}
                      {isPlayingAudio && isEmperor && !isGeneratingAudio && (
                        <div className="absolute -top-8 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1 animate-pulse">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
                          </svg>
                          播放中
                        </div>
                      )}
                      
                      {/* 手动播放按钮 - 当自动播放被阻止时显示 */}
                      {audioReady && isEmperor && !isPlayingAudio && !isGeneratingAudio && (
                        <div className="absolute -top-8 right-2 z-40">
                          <button
                            onClick={manualPlayAudio}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1 transition-all animate-bounce"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                            </svg>
                            点击播放
                          </button>
                        </div>
                      )}
                      
                      <div 
                        ref={(el) => {
                          if (el && isTyping) {
                            el.scrollTop = el.scrollHeight;
                          }
                        }}
                        className="p-3 overflow-y-auto scrollbar-thin" 
                        style={{ maxHeight: '120px' }}
                      >
                        <p className="text-cyan-100 text-xs whitespace-pre-wrap leading-relaxed">
                          <span className="text-yellow-300 font-bold">【大臣回复】</span>
                          <br />
                          {cleanContent(displayedTasks[0].displayResult || displayedTasks[0].result)}
                          {isTyping && displayedTasks[0].displayResult && displayedTasks[0].displayResult.length < displayedTasks[0].result.length && (
                            <span className="animate-pulse">|</span>
                          )}
                        </p>
                      </div>
                      {/* 气泡尾巴 - 指向大臣 */}
                      <div className="absolute bottom-0 left-1/2 transform translate-y-full -translate-x-1/2">
                        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-cyan-400"></div>
                      </div>
                    </div>
                  </>
                )}
                
                <img
                  src={slaveImage}
                  alt="Minister"
                  className="w-28 h-28 object-contain drop-shadow-xl"
                />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-bold border-2 border-gray-300 whitespace-nowrap">
                  {minister.user.nickname}
                </div>
                {minister.grudge_value > 80 && (
                  <div className="absolute -top-4 -right-4 text-4xl animate-bounce">😤</div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center w-full py-8">
              {/* 暂无大臣 */}
            </div>
          )}
        </div>
      </div>

      {/* 广发英雄帖弹窗 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-amber-900 mb-4 text-chinese-title">
              广发英雄帖
            </h2>
            <p className="text-gray-600 mb-4 text-chinese-elegant">
              将此英雄帖分享给好友，邀其入朝共襄盛举！
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-4 break-all border-2 border-gray-300">
              <code className="text-sm select-all">{inviteLink}</code>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              💡 提示：点击"抄录英雄帖"按钮，或直接选中上方链接手动复制
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-chinese-elegant"
              >
                关闭
              </button>
              <button
                onClick={copyInviteLink}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all text-chinese-elegant"
              >
                抄录英雄帖
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 发布圣旨 - 使用圣旨图片作为背景 */}
      {showTaskModal && selectedSlave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50" onClick={() => {
          setShowTaskModal(false);
          setTaskDescription('');
          setSelectedSlave(null);
        }}>
          <div 
            className="relative w-full max-w-3xl h-[80vh] flex items-center justify-center animate-scaleIn" 
            onClick={(e) => {
              e.stopPropagation();
              // 点击圣旨区域时聚焦到隐藏的输入框
              document.getElementById('hidden-input')?.focus();
            }}
            style={{
              backgroundImage: `url(${shengzhiImage})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              cursor: 'text'
            }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTaskModal(false);
                setTaskDescription('');
                setSelectedSlave(null);
              }}
              className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 text-3xl font-bold z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/30 transition-all"
            >
              ×
            </button>

            {/* 圣旨内容区域 - 使用绝对定位 */}
            <div 
              className="absolute"
              style={{
                top: '25%',
                left: '15%',
                width: '70%',
                height: '50%'
              }}
            >
              {/* 右上角：给XX下圣旨（竖排） - 在书写区域外 */}
              <div className="absolute top-0 right-0 flex flex-col items-center gap-1 text-red-600 font-bold text-sm text-chinese-title">
                {`给${(selectedSlave?.user?.nickname || 'XX').slice(0, 3)}下圣旨`.split('').map((char, index) => (
                  <span key={index}>{char}</span>
                ))}
              </div>
              
              {/* 左下角：皇上的昵称（竖排） - 在书写区域外 */}
              <div className="absolute bottom-0 left-0 flex flex-col items-center gap-1 text-red-600 font-bold text-sm text-chinese-title">
                {(user?.nickname || '皇上').slice(0, 3).split('').map((char, index) => (
                  <span key={index}>{char}</span>
                ))}
              </div>
              
              {/* 实际书写区域 - 避开署名区域 */}
              <div 
                className="absolute flex flex-row items-start justify-end gap-3"
                style={{
                  top: '5%',
                  bottom: '12%',
                  left: '8%',
                  right: '8%',
                  overflow: 'hidden'
                }}
                onClick={() => document.getElementById('hidden-input')?.focus()}
              >
                {taskDescription.length === 0 ? (
                  // 占位符在右侧
                  <div className="absolute top-0 right-0 flex flex-col items-center gap-1 text-gray-400 text-sm text-chinese-elegant animate-pulse">
                    {'点击此处开始书写圣旨...'.split('').map((char, index) => (
                      <span key={index}>{char}</span>
                    ))}
                  </div>
                ) : (
                  // 文字从右往左排列
                  taskDescription.split('').reduce((cols: string[][], char: string, index: number) => {
                    const colIndex = Math.floor(index / 10); // 每列最多 10 个字
                    if (!cols[colIndex]) cols[colIndex] = [];
                    cols[colIndex].push(char);
                    return cols;
                  }, []).reverse().map((col: string[], colIndex: number) => (
                    <div
                      key={colIndex}
                      className="flex flex-col items-center gap-1"
                    >
                      {col.map((char: string, charIndex: number) => (
                        <span
                          key={charIndex}
                          className="text-lg font-bold text-gray-900 text-chinese-elegant"
                          style={{ 
                            display: 'block',
                            minWidth: '1em',
                            minHeight: '1.3em',
                            textAlign: 'center',
                            lineHeight: '1.3'
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 完全隐藏的输入框 - 用于捕获键盘输入 */}
            <textarea
              id="hidden-input"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="absolute opacity-0 pointer-events-none"
              style={{ position: 'absolute', left: '-9999px' }}
              autoFocus
            />

            {/* 发布按钮 - 在圣旨图片外面底部居中 */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateTask();
                }}
                disabled={!taskDescription.trim()}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg text-chinese-elegant btn-imperial"
              >
                下达圣旨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 - 游戏风格 */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-8 py-4 rounded-2xl shadow-2xl transition-all duration-500 animate-scaleIn border-4 ${
          toast.type === 'success' 
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-600 text-amber-900' 
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

      {/* 审批按钮遮罩层 - 只有皇帝能看到，且打字完成后显示 */}
      {isEmperor && showApprovalButtons && tasks.length > 0 && displayedTasks[0]?.result && displayedTasks[0]?.approval_status !== 'approved' && displayedTasks[0]?.approval_status !== 'closed' && (
        <>
          {/* 全屏半透明遮罩 */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          
          {/* 审批按钮 - 使用图片资源 */}
          <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 flex gap-20 z-[51]">
            {/* 结 */}
            <div className="flex flex-col items-center">
              <img
                src={endImage}
                alt="结"
                onClick={() => handleCloseTask(displayedTasks[0].id)}
                className="w-32 h-32 object-contain cursor-pointer transition-transform duration-300 hover:scale-110 drop-shadow-2xl"
              />
            </div>
            
            {/* 准 */}
            <div className="flex flex-col items-center">
              <img
                src={agreeImage}
                alt="准"
                onClick={() => {
                  setSelectedTaskForApproval(displayedTasks[0]);
                  setShowApproveModal(true);
                }}
                className="w-32 h-32 object-contain cursor-pointer transition-transform duration-300 hover:scale-110 drop-shadow-2xl"
              />
            </div>
            
            {/* 驳 */}
            <div className="flex flex-col items-center">
              <img
                src={disagreeImage}
                alt="驳"
                onClick={() => {
                  setSelectedTaskForRejection(displayedTasks[0]);
                  setShowRejectModal(true);
                }}
                className="w-32 h-32 object-contain cursor-pointer transition-transform duration-300 hover:scale-110 drop-shadow-2xl"
              />
            </div>
          </div>
          
          {/* 宫女提示 - 从右边滑入 */}
          <div className="fixed bottom-20 right-8 z-[51] flex items-center gap-4 animate-slideInRight">
            {/* 宫女说话气泡 */}
            <div className="relative bg-pink-100 rounded-3xl p-4 shadow-xl border-2 border-pink-300 max-w-xs animate-scaleIn" style={{ animationDelay: '0.3s' }}>
              <p className="text-pink-900 text-sm text-chinese-elegant leading-relaxed">
                <span className="font-bold text-pink-700">陛下，</span>
                <br />
                <span className="text-amber-700">「结」</span>可结束此事，
                <br />
                <span className="text-green-700">「准」</span>可准奏执行，
                <br />
                <span className="text-red-700">「驳」</span>可驳回重做。
              </p>
              {/* 气泡尾巴 - 简单三角形指向右边 */}
              <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 -ml-1">
                <div className="w-0 h-0 border-l-[16px] border-l-pink-100 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent"></div>
              </div>
            </div>
            
            {/* 宫女图片 */}
            <img
              src={gongnvImage}
              alt="宫女"
              className="w-32 h-32 object-contain drop-shadow-2xl"
            />
          </div>
        </>
      )}

      {/* 退出确认弹窗 */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4 text-chinese-title">
              {isEmperor ? '⚠️ 退位让贤' : '⚠️ 告老还乡'}
            </h2>
            <p className="text-gray-600 mb-6 text-chinese-elegant">
              {isEmperor 
                ? '确定要退位让贤吗？这将解散整个朝堂，所有成员都将离开，此操作不可恢复！' 
                : '确定要告老还乡吗？你将退出这个朝堂。'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  if (isEmperor) {
                    handleDestroyCourt();
                  } else {
                    handleLeaveCourt();
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 准奏弹窗 */}
      {showApproveModal && selectedTaskForApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              准奏
            </h2>
            <p className="text-gray-600 mb-4">
              可以添加补充说明（可选），大臣将根据你的指示继续执行。
            </p>
            <textarea
              value={approvalFeedback}
              onChange={(e) => setApprovalFeedback(e.target.value)}
              placeholder="例如：按你的方案执行，注意控制成本...（可留空直接准奏）"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovalFeedback('');
                  setSelectedTaskForApproval(null);
                  setShowApprovalButtons(true); // 取消时恢复审批按钮
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleApproveTask}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                确定准奏
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 驳回弹窗 */}
      {showRejectModal && selectedTaskForRejection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              驳回方案
            </h2>
            <p className="text-gray-600 mb-4">
              请说明驳回理由，大臣将根据你的意见重新设计方案。
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="例如：方案不够详细，需要考虑成本问题..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedTaskForRejection(null);
                  setShowApprovalButtons(true); // 取消时恢复审批按钮
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleRejectTask}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                确定驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 惩罚弹窗 */}
      {showPunishModal && selectedTaskForPunishment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-purple-600 mb-2 text-chinese-title">
              惩罚大臣
            </h2>
            <p className="text-amber-700 font-bold mb-4 text-chinese-elegant">
              惩罚对象：{selectedTaskForPunishment.user?.nickname || '未知'}
            </p>
            <p className="text-gray-600 mb-4 text-chinese-elegant">
              朕对此臣不满！请描述惩罚原因，朕的虚拟分身会让其在广场自我检讨。
            </p>
            <textarea
              value={punishmentContent}
              onChange={(e) => setPunishmentContent(e.target.value)}
              placeholder="例如：办事不力，屡次拖延，辜负圣恩..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 text-chinese-elegant"
              autoFocus
            />
            <p className="text-xs text-gray-500 mb-4">
              💡 AI 将根据你的描述自动生成羞耻文案，以 {selectedTaskForPunishment.user?.nickname} 的虚拟分身名义发布到 SecondMe Plaza 广场
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPunishModal(false);
                  setPunishmentContent('');
                  setSelectedTaskForPunishment(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-chinese-elegant"
              >
                取消
              </button>
              <button
                onClick={handlePunishMinister}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-chinese-elegant"
              >
                执行惩罚
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 惩罚求饶动画 - 半全屏 */}
      {showPunishmentAnimation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] animate-fadeIn">
          <div className="relative flex flex-col items-center justify-center">
            <img 
              src={qiuraoGif} 
              alt="求饶" 
              className="w-[400px] h-[400px] object-contain"
            />
            <div className="mt-6 text-white text-2xl font-bold text-chinese-title animate-pulse">
              大臣正在撰写检讨...
            </div>
          </div>
        </div>
      )}

      {/* 惩罚结果显示 - 检讨书 */}
      {showPunishmentResult && generatedPunishmentText && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] animate-fadeIn">
          <div className="relative w-[500px] h-[600px]">
            {/* 检讨书背景图 */}
            <img 
              src={jiantaoImage} 
              alt="检讨书" 
              className="w-full h-full object-contain"
            />
            
            {/* 检讨内容覆盖层 */}
            <div className="absolute inset-0 flex flex-col items-center px-20 pt-32 pb-16">
              {/* 检讨内容区域 */}
              <div className="flex-1 w-full flex items-start justify-center overflow-hidden">
                <div className="w-full max-h-[350px] overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-transparent">
                  <p className="text-gray-800 text-base leading-loose text-center text-chinese-elegant whitespace-pre-wrap" style={{ fontFamily: "'KaiTi', 'STKaiti', 'SimKai', serif" }}>
                    {generatedPunishmentText}
                  </p>
                </div>
              </div>
              
              {/* 已阅按钮 */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    setShowPunishmentResult(false);
                    setGeneratedPunishmentText('');
                  }}
                  className="px-10 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-lg font-bold text-chinese-elegant transition-all hover:scale-105 shadow-lg border-2 border-red-800"
                  style={{ fontFamily: "'KaiTi', 'STKaiti', 'SimKai', serif" }}
                >
                  已阅
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 悄悄话弹窗 */}
      {showWhisperModal && whisperTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-purple-600 mb-2 text-chinese-title">
              说悄悄话
            </h2>
            <p className="text-amber-700 font-bold mb-4 text-chinese-elegant">
              对象：{whisperTarget.user?.nickname || '未知'}
            </p>
            <p className="text-gray-600 mb-4 text-chinese-elegant text-sm">
              💡 输入你想说的话，对方会自动回复（皇上也能看到哦）
            </p>
            <textarea
              value={whisperMessage}
              onChange={(e) => setWhisperMessage(e.target.value)}
              placeholder="例如：今天皇上下的任务好难啊..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 text-chinese-elegant"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWhisperModal(false);
                  setWhisperMessage('');
                  setWhisperTarget(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-chinese-elegant"
              >
                取消
              </button>
              <button
                onClick={handleSendWhisper}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-chinese-elegant"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 文件库弹窗 */}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-amber-100 via-orange-100 to-amber-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[70vh] flex flex-col border-4 border-amber-900/40 relative game-panel">
            {/* 装饰性边框 */}
            <div className="absolute inset-2 border-2 border-amber-700/20 rounded-xl pointer-events-none"></div>
            
            {/* 标题栏 */}
            <div className="relative flex justify-between items-center px-6 py-4 border-b-2 border-amber-900/20">
              <h2 className="text-2xl font-bold text-amber-900 text-chinese-title flex items-center gap-2">
                <span className="text-3xl">📜</span>
                档案阁
              </h2>
              <button
                onClick={() => {
                  setShowFilesModal(false);
                  setSelectedFile(null);
                }}
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-2xl flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              >
                ×
              </button>
            </div>
            
            <p className="relative px-6 pt-3 pb-2 text-amber-800/70 text-sm text-chinese-elegant">
              大臣们生成的文档、演示文稿等文件都在这里
            </p>
            
            {/* 主体区域 */}
            <div className="relative flex-1 flex gap-4 px-6 pb-6 overflow-hidden">
              {/* 左侧：预览区 */}
              <div className="w-2/5 bg-amber-200/40 rounded-xl p-4 flex flex-col game-inset-panel">
                <h3 className="text-lg font-bold text-amber-900 mb-3 text-chinese-title">预览</h3>
                {selectedFile ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* 文件图标 - 缩小 */}
                    <div className="flex items-center justify-center py-3">
                      {getFileIcon(selectedFile.filename)}
                    </div>
                    
                    {/* 文件信息 - 扩展 */}
                    <div className="flex-1 space-y-3 bg-amber-100/60 rounded-lg p-4 border-2 border-amber-900/20 overflow-y-auto custom-scrollbar game-inset-small">
                      <div>
                        <p className="text-xs text-amber-800 mb-1 font-medium">文件名</p>
                        <p className="text-sm text-amber-900 break-all leading-relaxed">{selectedFile.filename}</p>
                      </div>
                      
                      <div className="pt-2 border-t border-amber-900/10">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-amber-800 mb-1 font-medium">文件大小</p>
                            <p className="text-sm text-amber-900">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                          <div>
                            <p className="text-xs text-amber-800 mb-1 font-medium">文件类型</p>
                            <p className="text-sm text-amber-900">{getFileType(selectedFile.filename)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-amber-900/10">
                        <p className="text-xs text-amber-800 mb-1 font-medium">创建时间</p>
                        <p className="text-sm text-amber-900">{new Date(selectedFile.createdAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}</p>
                      </div>
                      
                      <div className="pt-2 border-t border-amber-900/10">
                        <p className="text-xs text-amber-800 mb-1 font-medium">文件路径</p>
                        <p className="text-xs text-amber-900/70 break-all font-mono">outputs/{selectedFile.filename}</p>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-2 mt-4">
                      <a
                        href={fileAPI.downloadOutput(selectedFile.filename)}
                        download
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium text-center shadow-md hover:shadow-lg transition-all border-2 border-green-800/30"
                      >
                        下载
                      </a>
                      <button
                        onClick={async () => {
                          if (confirm('确定要删除这个文件吗？')) {
                            try {
                              await fileAPI.deleteOutput(selectedFile.filename);
                              showToast('文件已删除');
                              setSelectedFile(null);
                              refetchFiles();
                            } catch (error) {
                              showToast('删除失败', 'error');
                            }
                          }
                        }}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all border-2 border-red-800/30"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-amber-700/40">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-3 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20,6H12L10,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8A2,2 0 0,0 20,6M20,18H4V6H9.17L11.17,8H20V18M13,10H11V13H8V15H11V18H13V15H16V13H13V10Z" />
                      </svg>
                      <p className="text-sm text-chinese-elegant">点击右侧文件查看详情</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 右侧：奏章列表 */}
              <div className="flex-1 bg-amber-200/40 rounded-xl p-4 flex flex-col overflow-hidden game-inset-panel">
                <h3 className="text-lg font-bold text-amber-900 mb-3 text-chinese-title">奏章列表</h3>
                
                {fileOrder && fileOrder.length > 0 ? (
                  <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
                    <div className="grid grid-cols-6 gap-2">
                      {fileOrder.slice(0, 18).map((file: any, index: number) => (
                        <div
                          key={file.filename}
                          draggable
                          onDragStart={() => setDraggedFile(file)}
                          onDragEnd={() => setDraggedFile(null)}
                          onDragOver={(e) => handleDragOver(e, file)}
                          onClick={() => setSelectedFile(file)}
                          className={`
                            relative group cursor-pointer bg-amber-100/80 
                            rounded-lg p-2 transition-all duration-200 aspect-square flex flex-col items-center justify-center
                            hover:scale-105 hover:shadow-lg hover:z-10 game-item-slot
                            ${selectedFile?.filename === file.filename 
                              ? 'ring-2 ring-amber-600 shadow-md bg-amber-200' 
                              : 'hover:bg-amber-200/80'
                            }
                            ${draggedFile?.filename === file.filename ? 'opacity-50 scale-95' : ''}
                          `}
                          style={{
                            animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both`
                          }}
                          title={file.filename}
                        >
                          {/* 文件图标 - 缩小 */}
                          <div className="mb-1 group-hover:scale-110 transition-transform scale-75">
                            {getFileIcon(file.filename)}
                          </div>
                          
                          {/* 文件名（截断） */}
                          <p className="text-xs text-amber-900 text-center truncate w-full font-medium px-1">
                            {file.filename.length > 10 
                              ? file.filename.substring(0, 8) + '...' 
                              : file.filename}
                          </p>
                          
                          {/* 悬浮提示 */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 max-w-xs truncate">
                            {file.filename}
                          </div>
                          
                          {/* 选中标记 */}
                          {selectedFile?.filename === file.filename && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs shadow-md">
                              ✓
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* 填充空格子到18个（3行x6列） */}
                      {Array.from({ length: Math.max(0, 18 - fileOrder.length) }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square rounded-lg bg-amber-100/40 game-item-slot-empty"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-amber-700/40">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-3 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19,20H4C2.89,20 2,19.1 2,18V6C2,4.89 2.89,4 4,4H10L12,6H19A2,2 0 0,1 21,8H21L4,8V18L6.14,10H23.21L20.93,18.5C20.7,19.37 19.92,20 19,20Z" />
                      </svg>
                      <p className="text-sm text-chinese-elegant">暂无文件</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 招贤纳士弹窗 - 显示卡牌背面 */}
      {showSummonModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl border-4 border-amber-400 animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-amber-900 text-chinese-title text-gold-gradient">
                招贤纳士
              </h2>
              <button
                onClick={() => setShowSummonModal(false)}
                className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-xl flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              >
                ×
              </button>
            </div>
            
            <p className="text-amber-700 mb-4 text-chinese-elegant text-center text-sm">
              点击卡牌翻开，招募 SecondMe 虚拟分身入朝为官
            </p>

            {availableBots.length > 0 ? (
              <div 
                className="grid grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-2"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <style>{`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                  .card-back {
                    cursor: pointer;
                    transition: transform 0.3s ease;
                  }
                  .card-back:hover {
                    transform: translateY(-10px);
                  }
                `}</style>
                {availableBots.map((bot: any) => (
                  <div
                    key={bot.id}
                    onClick={handleCardClick}
                    className="card-back hide-scrollbar"
                  >
                    <img
                      src={cardBackImage}
                      alt="卡牌背面"
                      className="w-full h-auto rounded-xl shadow-lg"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🤷</div>
                <p className="text-amber-700 text-base text-chinese-elegant">
                  暂无可招募的贤士
                </p>
                <p className="text-amber-500 text-xs text-chinese-elegant mt-1">
                  所有用户都已在朝堂中
                </p>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowSummonModal(false)}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-bold transition-all text-chinese-elegant text-sm"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 翻牌动画全屏遮罩 */}
      {showCardFlip && selectedBot && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]">
          <div className="relative w-[400px] h-[600px]" style={{ perspective: '1000px' }}>
            <div
              className="relative w-full h-full transition-transform duration-1000"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* 卡牌背面 */}
              <div
                className="absolute w-full h-full"
                style={{
                  backfaceVisibility: 'hidden',
                }}
              >
                <img
                  src={cardBackImage}
                  alt="卡牌背面"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 卡牌正面 - 包含用户信息 */}
              <div
                className="absolute w-full h-full"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="relative w-full h-full">
                  {/* 卡牌正面背景 */}
                  <img
                    src={cardFrontImage}
                    alt="卡牌正面"
                    className="w-full h-full object-contain"
                  />
                  
                  {/* 用户信息叠加层 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    {/* 头像 */}
                    <div className="mb-4">
                      {selectedBot.avatar ? (
                        <img
                          src={selectedBot.avatar}
                          alt={selectedBot.nickname}
                          className="w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-2xl"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-5xl font-bold border-4 border-purple-400 shadow-2xl">
                          {selectedBot.nickname?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    
                    {/* 昵称 */}
                    <h3 className="text-3xl font-bold text-purple-900 text-chinese-title mb-2">
                      {selectedBot.nickname}
                    </h3>
                    
                    {/* 个人简介 */}
                    {selectedBot.bio && (
                      <div className="mb-4 max-w-sm max-h-32 overflow-y-auto">
                        <p className="text-purple-700 text-xs text-chinese-elegant text-center leading-relaxed px-4">
                          {/* 提取总体概述部分，如果没有则显示前200个字符 */}
                          {(() => {
                            const bio = selectedBot.bio;
                            // 尝试提取"总体概述"部分
                            const overviewMatch = bio.match(/### 总体概述 ###\s*\n([\s\S]*?)(?:\n###|$)/);
                            if (overviewMatch && overviewMatch[1]) {
                              return overviewMatch[1].trim().substring(0, 150) + (overviewMatch[1].length > 150 ? '...' : '');
                            }
                            // 如果没有总体概述，尝试提取第一段
                            const firstParagraph = bio.split('\n\n')[0].replace(/###.*###/g, '').trim();
                            return firstParagraph.substring(0, 150) + (firstParagraph.length > 150 ? '...' : '');
                          })()}
                        </p>
                      </div>
                    )}
                    
                    {/* 描述 */}
                    <p className="text-purple-600 text-xs text-chinese-elegant text-center mb-6">
                      SecondMe 虚拟分身
                    </p>
                    
                    {/* 按钮 */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleCancelSummon}
                        disabled={isSummoning}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-bold transition-all text-chinese-elegant disabled:opacity-50"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleConfirmSummon}
                        disabled={isSummoning}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all text-chinese-elegant shadow-lg disabled:opacity-50"
                      >
                        {isSummoning ? '招募中...' : '确认招募'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 性别选择弹窗 */}
      {showGenderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full animate-scaleIn">
            <h1 className="text-3xl font-bold text-amber-600 mb-2 text-center text-chinese-title">
              选择你的身份
            </h1>
            <p className="text-gray-600 mb-6 text-sm text-center text-chinese-elegant">
              选择你在朝堂中的形象
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* 皇上选项 - 金黄色边框 */}
              <button
                onClick={() => setSelectedGender('male')}
                className={`p-6 rounded-3xl border-4 transition-all transform hover:scale-105 ${
                  selectedGender === 'male'
                    ? 'border-amber-400 bg-amber-50/30 shadow-xl'
                    : 'border-amber-400 bg-white hover:bg-amber-50/20 shadow-md'
                }`}
              >
                <div className="flex flex-col items-center">
                  <img 
                    src={kingImage} 
                    alt="皇上" 
                    className="w-48 h-48 object-contain mb-3"
                  />
                  <div className="font-bold text-xl text-amber-900 text-chinese-title mb-1">皇上</div>
                  <div className="text-xs text-gray-500 text-chinese-elegant">男性形象</div>
                </div>
              </button>

              {/* 皇后选项 - 粉色边框 */}
              <button
                onClick={() => setSelectedGender('female')}
                className={`p-6 rounded-3xl border-4 transition-all transform hover:scale-105 ${
                  selectedGender === 'female'
                    ? 'border-pink-500 bg-pink-50 shadow-xl'
                    : 'border-pink-500 bg-white hover:bg-pink-50/30 shadow-md'
                }`}
              >
                <div className="flex flex-col items-center">
                  <img 
                    src={queenImage} 
                    alt="皇后" 
                    className="w-48 h-48 object-contain mb-3"
                  />
                  <div className="font-bold text-xl text-pink-900 text-chinese-title mb-1">皇后</div>
                  <div className="text-xs text-gray-500 text-chinese-elegant">女性形象</div>
                </div>
              </button>
            </div>

            <button
              onClick={handleGenderSubmit}
              disabled={isSubmittingGender}
              className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 text-lg text-chinese-elegant"
            >
              {isSubmittingGender ? '保存中...' : '钦此'}
            </button>
          </div>
        </div>
      )}

      {/* 疆土拓展弹窗 - 显示场景卡牌 */}
      {showTerritoryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 max-w-3xl w-full shadow-2xl border-4 border-amber-400 animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-amber-900 text-chinese-title text-gold-gradient">
                疆土拓展
              </h2>
              <button
                onClick={() => setShowTerritoryModal(false)}
                className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-xl flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              >
                ×
              </button>
            </div>
            
            <p className="text-amber-700 mb-4 text-chinese-elegant text-center text-sm">
              点击已解锁的场景切换背景
            </p>

            <div 
              className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {availableScenes.map((scene: any) => {
                const isUnlocked = unlockedScenes.includes(scene.id);
                const isNextToUnlock = nextScene?.id === scene.id && canUnlockNext;
                
                return (
                  <div
                    key={scene.id}
                    onClick={() => {
                      if (isUnlocked) {
                        handleSceneCardClick(scene);
                      } else if (isNextToUnlock) {
                        // 达到100%，可以点击翻转
                        handleUnlockNextScene();
                      }
                    }}
                    className={`${isUnlocked || isNextToUnlock ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'} transition-transform duration-300`}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl shadow-lg">
                      {isUnlocked ? (
                        // 已解锁：只显示场景图片
                        <>
                          <img
                            src={scene.image}
                            alt={scene.name}
                            className="w-full h-full object-cover"
                          />
                          {/* 场景名称 */}
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                            <div className="bg-black/70 backdrop-blur-sm px-4 py-1 rounded-full">
                              <span className="text-white font-bold text-base text-chinese-elegant drop-shadow-lg">
                                {scene.name}
                              </span>
                            </div>
                          </div>
                          {/* 当前标签 */}
                          {currentBackground === scene.id && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              当前
                            </div>
                          )}
                        </>
                      ) : isNextToUnlock ? (
                        // 达到100%：显示卡牌背面，无锁，可点击翻转 - 增强视觉效果
                        <>
                          <img
                            src={bgCardBack}
                            alt="待解锁"
                            className="w-full h-full object-cover"
                          />
                          {/* 金色光晕边框 */}
                          <div className="absolute inset-0 rounded-xl border-4 border-yellow-400 animate-pulse shadow-[0_0_30px_rgba(250,204,21,0.8)]"></div>
                          
                          {/* 场景名称 - 垂直居中显示 */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 px-8 py-4 rounded-full shadow-2xl animate-pulse">
                              <span className="text-white font-black text-4xl text-chinese-title drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                                {scene.name}
                              </span>
                            </div>
                          </div>
                          
                          {/* 提示文字 - 底部 */}
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <div className="bg-red-500 text-white px-6 py-2 rounded-full text-base font-bold animate-bounce shadow-2xl">
                              ⚔️ 点击征战 ⚔️
                            </div>
                          </div>
                        </>
                      ) : (
                        // 未达到100%：显示卡牌背面 + 遮罩 + 锁
                        <>
                          <img
                            src={bgCardBack}
                            alt="未解锁"
                            className="w-full h-full object-cover"
                          />
                          {/* 黑色遮罩 */}
                          <div className="absolute inset-0 bg-black/50 rounded-xl"></div>
                          {/* 锁图标 SVG */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg 
                              className="w-20 h-20 text-gray-300 drop-shadow-2xl"
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V20h-2v-2.277c-.595-.347-1-.984-1-1.723 0-1.103.897-2 2-2s2 .897 2 2c0 .738-.405 1.376-1 1.723z"/>
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowTerritoryModal(false)}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-bold transition-all text-chinese-elegant text-sm"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 场景翻牌动画全屏遮罩 */}
      {showSceneCardFlip && selectedScene && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]">
          {/* 横向卡片容器 - 16:9 比例 */}
          <div className="relative w-[640px] h-[360px]" style={{ perspective: '1500px' }}>
            <div
              className="relative w-full h-full transition-transform duration-1000"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlippingScene ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* 卡牌背面 */}
              <div
                className="absolute w-full h-full"
                style={{
                  backfaceVisibility: 'hidden',
                }}
              >
                <img
                  src={bgCardBack}
                  alt="卡牌背面"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 卡牌正面 - 使用新的卡片正面 */}
              <div
                className="absolute w-full h-full"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="relative w-full h-full">
                  {/* 卡片正面背景 */}
                  <img
                    src={bgCardFront}
                    alt="卡片正面"
                    className="w-full h-full object-contain"
                    style={{ objectPosition: 'center top' }}
                  />
                  
                  {/* 场景图片叠加在卡片上 - 限制最大尺寸 */}
                  <div className="absolute inset-0 flex items-start justify-center pt-12 px-12">
                    <div className="relative max-w-[80%] max-h-[55%]">
                      <img
                        src={selectedScene.image}
                        alt={selectedScene.name}
                        className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      />
                    </div>
                  </div>
                  
                  {/* 场景信息叠加层 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-6">
                    {/* 场景名称 */}
                    <div className="bg-black/70 backdrop-blur-sm px-6 py-2 rounded-full mb-2">
                      <h3 className="text-2xl font-bold text-white text-chinese-title drop-shadow-lg">
                        {selectedScene.name}
                      </h3>
                    </div>
                    
                    {/* 场景描述 */}
                    <div className="bg-black/70 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                      <p className="text-white text-sm text-chinese-elegant text-center drop-shadow-lg">
                        {selectedScene.description}
                      </p>
                    </div>
                    
                    {/* 按钮 */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleCancelScene}
                        className="px-6 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-bold transition-all text-chinese-elegant"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => {
                          // 判断是否是待解锁的场景
                          const isUnlocked = unlockedScenes.includes(selectedScene.id);
                          if (isUnlocked) {
                            handleConfirmScene();
                          } else {
                            handleStartConquest();
                          }
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all text-chinese-elegant shadow-lg"
                      >
                        {unlockedScenes.includes(selectedScene.id) ? '选择此场景' : '去征战'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 征战视频全屏播放 */}
      {showConquestVideo && (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center">
          <video
            autoPlay
            className="max-w-[80%] max-h-[80%] object-contain"
            onEnded={handleConquestComplete}
          >
            <source src={conquestVideo} type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
}
