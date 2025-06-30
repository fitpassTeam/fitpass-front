import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../api-config';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { getMyGyms } from '../../api/gyms';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getWsUrl() {
  if (!API_BASE_URL) return '';
  if (API_BASE_URL.startsWith('https://')) {
    return API_BASE_URL + '/ws';
  } else if (API_BASE_URL.startsWith('http://')) {
    return API_BASE_URL + '/ws';
  }
  return 'http://' + API_BASE_URL + '/ws';
}

export default function ChatRoomPage() {
  const { chatRoomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [receiverName, setReceiverName] = useState('상대방');
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const wsUrl = getWsUrl();

  // 로그인 유저 정보 가져오기
  const { data: userInfo } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data?.data;
    },
    enabled: !!localStorage.getItem('token'),
  });

  // 내 체육관 목록 가져오기 (오너만)
  const { data: myGyms } = useQuery({
    queryKey: ['myGyms'],
    queryFn: getMyGyms,
    enabled: userInfo?.userRole === 'OWNER',
    select: res => Array.isArray(res.data?.data) ? res.data.data : [],
  });

  // 채팅방 정보 가져오기 (receiverId 필요)
  const { data: chatRoomInfo } = useQuery({
    queryKey: ['chatRoom', chatRoomId],
    queryFn: async () => {
      const res = await api.get(`/ws/chatRooms/${chatRoomId}`);
      console.log('채팅방 정보 조회 결과:', res.data?.data);
      return res.data?.data;
    },
    enabled: !!chatRoomId,
  });

  // 렌더링 부분에서 로딩 체크
  const isLoading = !userInfo || !chatRoomInfo || (userInfo.userRole === 'OWNER' && !myGyms);

  // 1. 과거 메시지 불러오기 (새로고침/입장 시)
  useEffect(() => {
    if (!chatRoomId) return;
    console.log('과거 메시지 조회 시작 - chatRoomId:', chatRoomId);
    api.get(`/ws/chatRooms/${chatRoomId}/messages`)
      .then(res => {
        const messages = Array.isArray(res.data?.data) ? res.data.data : [];
        console.log('과거 메시지 조회 결과:', messages);
        setMessages(messages);
      })
      .catch((error) => {
        console.error('과거 메시지 조회 실패:', error);
        setMessages([]);
      });
  }, [chatRoomId]);

  // 내 gym 정보(오너만)
  const myGym = userInfo?.userRole === 'OWNER'
    ? myGyms?.find(gym => String(gym.id ?? gym.gymId) === String(chatRoomInfo?.gymId))
    : null;

  // 2. 상대방 이름 불러오기 (myGyms도 의존성에 추가)
  useEffect(() => {
    if (!chatRoomInfo || !userInfo || (userInfo.userRole === 'OWNER' && !myGyms)) return;
    console.log('상대방 이름 조회 시작:', {
      userRole: userInfo.userRole,
      chatRoomInfo: chatRoomInfo,
      myGyms: myGyms
    });
    
    if (userInfo.userRole === 'OWNER') {
      api.get(`/users/${chatRoomInfo.userId}`)
        .then(res => {
          const userName = res.data?.data?.name || res.data?.data?.nickname || '유저';
          console.log('유저 이름 조회 결과:', userName);
          setReceiverName(userName);
        })
        .catch((error) => {
          console.error('유저 이름 조회 실패:', error);
          setReceiverName('유저');
        });
    } else {
      api.get(`/gyms/${chatRoomInfo.gymId}`)
        .then(res => {
          const gymName = res.data?.data?.name || '체육관';
          console.log('체육관 이름 조회 결과:', gymName);
          setReceiverName(gymName);
        })
        .catch((error) => {
          console.error('체육관 이름 조회 실패:', error);
          setReceiverName('체육관');
        });
    }
  }, [chatRoomInfo, userInfo, myGyms]);

  // 3. 메시지 스크롤 자동 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!wsUrl || !chatRoomId || !userInfo) {
      console.log('WebSocket 연결 조건 확인:', { wsUrl, chatRoomId, userInfo: !!userInfo });
      return;
    }
    
    console.log('WebSocket 연결 시작:', wsUrl);
    const sock = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => sock,
      debug: (str) => console.log('STOMP Debug:', str),
      reconnectDelay: 5000,
    });
    stompClient.current = client;
    
    client.onConnect = () => {
      console.log('✅ WebSocket 연결 성공, 채팅방 ID:', chatRoomId);
      // 구독: /topic/public (서버와 일치)
      client.subscribe('/topic/public', (message) => {
        console.log('📨 메시지 수신:', message.body);
        if (message.body) {
          const parsedMessage = JSON.parse(message.body);
          console.log('📝 파싱된 메시지:', parsedMessage);
          setMessages(prev => [...prev, parsedMessage]);
        }
      });
    };
    
    client.onStompError = (frame) => {
      console.error('❌ STOMP 에러:', frame);
    };
    
    client.onWebSocketError = (error) => {
      console.error('❌ WebSocket 에러:', error);
    };
    
    client.onWebSocketClose = () => {
      console.log('🔌 WebSocket 연결 종료');
    };
    
    client.activate();
    return () => {
      console.log('🧹 WebSocket 연결 정리');
      client.deactivate();
    };
  }, [wsUrl, chatRoomId, userInfo]);

  useEffect(() => {
    console.log('chatRoomInfo:', chatRoomInfo);
  }, [chatRoomInfo]);

  const sendMessage = () => {
    if (
      stompClient.current &&
      stompClient.current.connected &&
      userInfo &&
      chatRoomInfo &&
      input.trim() !== '' &&
      (userInfo.userRole !== 'OWNER' || myGym)
    ) {
      // 오너의 경우 체육관 ID를 senderId로 사용
      const senderId = userInfo.userRole === 'OWNER' ? (myGym?.id ?? myGym?.gymId ?? chatRoomInfo.gymId) : userInfo.id;
      const receiverId = userInfo.userRole === 'OWNER' ? chatRoomInfo.userId : chatRoomInfo.gymId;
      
      console.log('메시지 전송 - senderId:', senderId, 'receiverId:', receiverId, 'senderType:', userInfo.userRole === 'OWNER' ? 'GYM' : 'USER');
      
      const messageData = {
        message: input,
        senderId: senderId,
        senderType: userInfo.userRole === 'OWNER' ? 'GYM' : 'USER',
        receiverId: receiverId
      };
      try {
        stompClient.current.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(messageData)
        });
        setInput('');
      } catch (error) {
        console.error('메시지 전송 실패:', error);
        alert('메시지 전송 중 에러가 발생했습니다.');
      }
    } else {
      console.error('메시지 전송 조건 불만족:', {
        stompConnected: stompClient.current?.connected,
        userInfo: !!userInfo,
        chatRoomInfo: !!chatRoomInfo,
        input: input.trim(),
        myGym: !!myGym
      });
      alert('체육관 정보가 올바르지 않습니다. 새로고침 후 다시 시도해 주세요.');
    }
  };

  // isMine 함수로 변경
  const isMine = (msg) => {
    if (userInfo?.userRole === 'OWNER') {
      const myGymId = myGym?.id ?? myGym?.gymId ?? chatRoomInfo?.gymId;
      const isMyMessage = msg.senderType === 'GYM' && String(msg.senderId) === String(myGymId);
      console.log('오너 메시지 판별:', {
        msgSenderId: msg.senderId,
        myGymId: myGymId,
        isMyMessage: isMyMessage
      });
      return isMyMessage;
    } else {
      const isMyMessage = msg.senderType === 'USER' && String(msg.senderId) === String(userInfo?.id);
      console.log('유저 메시지 판별:', {
        msgSenderId: msg.senderId,
        userId: userInfo?.id,
        isMyMessage: isMyMessage
      });
      return isMyMessage;
    }
  };

  // 메시지 발신자 이름 가져오기 함수
  const getSenderName = (msg) => {
    if (isMine(msg)) {
      return userInfo?.userRole === 'OWNER' ? myGym?.name || '내 체육관' : userInfo?.name || userInfo?.nickname || '나';
    } else {
      return receiverName;
    }
  };

  // 렌더링
  return isLoading ? (
    <div>로딩 중...</div>
  ) : (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{receiverName.charAt(0)}</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{receiverName}</h2>
              <p className="text-xs text-green-500">● 온라인</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Phone size={18} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Video size={18} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical size={18} className="text-gray-600" />
          </button>
        </div>
      </motion.div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, idx) => {
            const mine = isMine(msg);
            const showTime = idx === 0 || 
              new Date(msg.createdAt).getTime() - new Date(messages[idx - 1]?.createdAt).getTime() > 300000; // 5분

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${mine ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div className="flex flex-col max-w-[70%]">
                  {showTime && (
                    <div className="text-center mb-2">
                      <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString('ko-KR', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : ''}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!mine && (
                      <div className={`w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-xs">{getSenderName(msg).charAt(0)}</span>
                      </div>
                    )}
                    <motion.div 
                      className={`px-4 py-3 rounded-2xl shadow-sm max-w-full break-words ${
                        mine 
                          ? 'bg-white text-gray-800 border border-gray-200' 
                          : 'bg-blue-100 text-gray-800'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <span className="text-xs font-semibold mb-1 block">{getSenderName(msg)}</span>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-1 ${mine ? 'text-gray-400' : 'text-blue-400'}`}>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </motion.div>
                    {mine && (
                      <div className={`w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-xs">{getSenderName(msg).charAt(0)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-t border-gray-200 px-4 py-4"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="메시지를 입력하세요..."
            />
          </div>
          <motion.button 
            type="submit" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim()}
          >
            <Send size={18} />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
} 