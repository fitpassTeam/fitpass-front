import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useUserQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { getGeneralPosts, getNoticePosts, getComments, createComment } from '../../api/posts';
import ReservationModal from '../ReservationModal';
import { FaRegCommentDots, FaRegHeart, FaHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
// import Swiper 등 캐러셀 라이브러리 필요시 추가

function formatTime(time) {
  // "18:43:00" -> "18:43"
  if (!time) return '';
  return time.split(':').slice(0, 2).join(':');
}

function GymDetail() {
  const { gymId: paramGymId } = useParams();
  const navigate = useNavigate();
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [mainIdx, setMainIdx] = useState(0); // 대표 이미지 인덱스
  const [modalOpen, setModalOpen] = useState(false);
  const [mainTrainerImgIdx, setMainTrainerImgIdx] = useState(0);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationType, setReservationType] = useState(null); // 'membership' | 'trainer'
  const [selectedMembershipId, setSelectedMembershipId] = useState(null);
  const [activeTab, setActiveTab] = useState('membership'); // 'membership' | 'post'
  const [postCategory, setPostCategory] = useState('notice'); // 'notice' | 'general'
  const [commentModal, setCommentModal] = useState({ open: false, post: null });
  const [carouselIdx, setCarouselIdx] = useState({}); // { [postId]: idx }
  const [likeState, setLikeState] = useState({}); // { [postId]: { liked: boolean, count: number } }
  const [commentList, setCommentList] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyInput, setReplyInput] = useState({}); // { [commentId]: 내용 }
  const [replyOpen, setReplyOpen] = useState({}); // { [commentId]: boolean }
  const [showReplies, setShowReplies] = useState({}); // { [commentId]: boolean }
  const [imgModal, setImgModal] = useState({ open: false, images: [], idx: 0 });
  const [editComment, setEditComment] = useState({ id: null, content: '' });
  const [commentMenu, setCommentMenu] = useState({ id: null, anchor: null });
  
  // 로그인 상태 확인
  const isLoggedIn = !!localStorage.getItem('token');

  // 로그인 안내 함수
  const showLoginAlert = () => {
    alert('로그인한 유저만 이용할 수 있습니다.');
  };

  // 체육관 상세 (상세조회 API 사용)
  const { data: gymData, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', paramGymId],
    queryFn: async () => {
      // 상세조회 API로 교체
      const res = await api.get(`/gyms/${paramGymId}`);
      return res.data?.data;
    },
    enabled: !!paramGymId,
  });

  // 트레이너 목록
  const { data: trainers = [] } = useQuery({
    queryKey: ['trainers', paramGymId],
    queryFn: async () => {
      const res = await api.get(`/gyms/${paramGymId}/trainers`);
      const arr = Array.isArray(res.data.data?.content) ? res.data.data.content : (Array.isArray(res.data.data) ? res.data.data : []);
      return arr.map(tr => ({ ...tr, trainerImage: tr.images || [] }));
    },
    enabled: !!paramGymId,
  });

  // 이용권 목록
  const { data: memberships = [] } = useQuery({
    queryKey: ['memberships', paramGymId],
    queryFn: async () => {
      const res = await api.get(`/gyms/${paramGymId}/memberships`);
      return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.data?.content) ? res.data.data.content : []);
    },
    enabled: !!paramGymId,
  });

  // 유저 정보 가져오기
  const { data: userInfo } = useUserQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data?.data;
    },
    enabled: !!isLoggedIn,
  });

  // 공지사항 목록
  const { data: noticePosts = [] } = useQuery({
    queryKey: ['noticePosts', paramGymId],
    queryFn: async () => {
      const res = await getNoticePosts(paramGymId);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!paramGymId && activeTab === 'post',
  });

  // 일반게시물 목록
  const { data: generalPosts = [] } = useQuery({
    queryKey: ['generalPosts', paramGymId],
    queryFn: async () => {
      const res = await getGeneralPosts(paramGymId);
      return Array.isArray(res.data?.content) ? res.data.content : [];
    },
    enabled: !!paramGymId && activeTab === 'post',
  });

  useEffect(() => { setMainIdx(0); }, [gymData]);

  const selectedTrainer = trainers.find(tr => String(tr.id) === String(selectedTrainerId));

  // 트레이너 상세 모달 동기화용 ref/state
  const leftImgRef = useRef();
  const rightCardRef = useRef();
  const buttonRef = useRef();
  const [buttonMargin, setButtonMargin] = useState(0);

  useLayoutEffect(() => {
    if (modalOpen && leftImgRef.current && rightCardRef.current && buttonRef.current) {
      const leftHeight = leftImgRef.current.offsetHeight;
      const rightCardHeight = rightCardRef.current.offsetHeight;
      const buttonHeight = buttonRef.current.offsetHeight;
      const gap = 0; // gap을 0으로 줄여 버튼이 더 아래로 내려가게
      const margin = Math.max(0, leftHeight - rightCardHeight - buttonHeight - gap);
      setButtonMargin(margin);
    }
  }, [modalOpen, selectedTrainer, mainTrainerImgIdx]);

  // 문의하기 버튼 클릭 핸들러 (체육관 오너와 채팅)
  const handleInquiry = async () => {
    if (!isLoggedIn) {
      showLoginAlert();
      return;
    }
    if (!userInfo) {
      alert('유저 정보를 불러오는 중입니다.');
      return;
    }
    const userId = userInfo.id ?? userInfo.userId;
    const userType = userInfo.userRole;
    const gymId = gymData?.id || gymData?.gymId || gymData?._id || paramGymId;
    if (!gymId || !userId || !userType) {
      alert('체육관 또는 유저 정보가 올바르지 않습니다.');
      return;
    }
    try {
      const res = await api.get(`/ws/chatRooms?userId=${userId}&userType=${userType}`);
      const chatRooms = Array.isArray(res.data?.data) ? res.data.data : [];
      const existRoom = chatRooms.find(room => String(room.userId) === String(userId) && String(room.gymId) === String(gymId));
      if (existRoom) {
        navigate(`/chat/${existRoom.chatRoomId}`);
        return;
      }
      const createRes = await api.post(`/ws/chatRooms?userId=${userId}&gymId=${gymId}`);
      const chatRoomId = createRes.data.data.chatRoomId;
      navigate(`/chat/${chatRoomId}`);
    } catch {
      alert('채팅방 생성/조회에 실패했습니다.');
    }
  };

  // 이용권 구매 모달 오픈
  const handleOpenMembershipModal = (membershipId) => {
    setReservationType('membership');
    setSelectedMembershipId(membershipId);
    setReservationModalOpen(true);
  };
  // 트레이너 예약 모달 오픈
  const handleOpenTrainerModal = (trainerId) => {
    setReservationType('trainer');
    setSelectedTrainerId(trainerId);
    setReservationModalOpen(true);
  };
  // 모달 닫기
  const handleCloseReservationModal = () => {
    setReservationModalOpen(false);
    setReservationType(null);
    setSelectedMembershipId(null);
    setSelectedTrainerId(null);
  };

  // 게시글 카드 내부 캐러셀 핸들러
  const handlePrevImg = (postId, images) => {
    setCarouselIdx(prev => ({
      ...prev,
      [postId]: (prev[postId] > 0 ? prev[postId] - 1 : images.length - 1)
    }));
  };
  const handleNextImg = (postId, images) => {
    setCarouselIdx(prev => ({
      ...prev,
      [postId]: (prev[postId] < images.length - 1 ? prev[postId] + 1 : 0)
    }));
  };

  // 좋아요 토글 핸들러
  const handleLikeToggle = async (post) => {
    try {
      await api.post(`/posts/${post.postId}/like`);
      setLikeState(prev => {
        const prevLiked = prev[post.postId]?.liked ?? false;
        const prevCount = prev[post.postId]?.count ?? post.likeCount ?? 0;
        return {
          ...prev,
          [post.postId]: {
            liked: !prevLiked,
            count: prevLiked ? prevCount - 1 : prevCount + 1
          }
        };
      });
    } catch {
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 댓글 모달 열릴 때 댓글 목록 불러오기
  useEffect(() => {
    if (commentModal.open && commentModal.post) {
      fetchComments(commentModal.post.postId);
    }
  }, [commentModal]);

  const fetchComments = async (postId) => {
    setCommentLoading(true);
    try {
      const res = await getComments(postId);
      setCommentList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCommentList([]);
    } finally {
      setCommentLoading(false);
    }
  };

  // 댓글 등록
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    try {
      await createComment(commentModal.post.postId, { content: commentInput });
      setCommentInput('');
      fetchComments(commentModal.post.postId);
    } catch {
      alert('댓글 등록 실패');
    }
  };
  // 대댓글 등록
  const handleReplySubmit = async (parentId) => {
    if (!replyInput[parentId]?.trim()) return;
    try {
      await createComment(commentModal.post.postId, { content: replyInput[parentId], parentId });
      setReplyInput(prev => ({ ...prev, [parentId]: '' }));
      setReplyOpen(prev => ({ ...prev, [parentId]: false }));
      fetchComments(commentModal.post.postId);
    } catch {
      alert('답글 등록 실패');
    }
  };

  // 댓글 수정 요청
  const handleUpdateComment = async (commentId, content) => {
    try {
      await api.patch(`/posts/${commentModal.post.postId}/comments/${commentId}`, { content });
      setEditComment({ id: null, content: '' });
      fetchComments(commentModal.post.postId);
    } catch {
      alert('댓글 수정 실패');
    }
  };
  // 댓글 삭제 요청
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/posts/${commentModal.post.postId}/comments/${commentId}`);
      setEditComment({ id: null, content: '' });
      fetchComments(commentModal.post.postId);
    } catch {
      alert('댓글 삭제 실패');
    }
  };

  // 댓글 트리 렌더링 (인스타/카카오 스타일 + 수정/삭제)
  const renderComments = (comments, depth = 0) => (
    <div>
      {comments.map(c => {
        const hasReplies = c.children && c.children.length > 0;
        const isRepliesOpen = showReplies[c.id] ?? true;
        const isMine = userInfo && c.writerId && String(userInfo.userId) === String(c.writerId);
        const isPostOwner = userInfo && c.postOwnerId && String(userInfo.userId) === String(c.postOwnerId);
        return (
          <div key={c.id} className={depth === 0 ? 'mb-3 p-3 rounded-xl bg-white shadow border' : 'mb-2 ml-6 pl-3 border-l-2 border-gray-200'} style={{background: depth === 0 ? '#fff' : 'transparent'}}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-blue-600 text-sm">{c.name || userInfo?.userName || '익명'}</span>
              <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
              {/* ...버튼: 내 댓글이면 수정/삭제, 게시글 주인이면 삭제 */}
              {(isMine || isPostOwner) && (
                <div className="relative inline-block ml-auto">
                  <button className="text-gray-400 hover:text-blue-500 px-2 text-lg" onClick={() => setCommentMenu({ id: c.id, anchor: c.id })}>⋯</button>
                  {commentMenu.id === c.id && (
                    <div className="absolute right-0 mt-1 bg-white border rounded shadow z-10 min-w-[80px]">
                      {isMine && (
                        <button className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50" onClick={() => { setEditComment({ id: c.id, content: c.content }); setCommentMenu({ id: null, anchor: null }); }}>수정</button>
                      )}
                      <button className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-500" onClick={() => { setCommentMenu({ id: null, anchor: null }); handleDeleteComment(c.id); }}>삭제</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* 수정 모드 */}
            {editComment.id === c.id ? (
              <form onSubmit={e => { e.preventDefault(); handleUpdateComment(c.id, editComment.content); }} className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={editComment.content}
                  onChange={e => setEditComment(ec => ({ ...ec, content: e.target.value }))}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  maxLength={200}
                  required
                  autoFocus
                />
                <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded text-sm">저장</button>
                <button type="button" className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm" onClick={() => setEditComment({ id: null, content: '' })}>취소</button>
              </form>
            ) : (
              <>
                <div className="text-gray-900 mb-1 whitespace-pre-line text-sm">{c.content}</div>
                <div className="flex gap-2 items-center mb-1">
                  {isLoggedIn && (
                    <button className="text-xs text-blue-400 hover:underline px-1 py-0.5 rounded transition" style={{background:'none'}} onClick={() => setReplyOpen(prev => ({ ...prev, [c.id]: !prev[c.id] }))}>답글달기</button>
                  )}
                  {hasReplies && depth === 0 && (
                    <button
                      className="text-xs text-gray-400 hover:text-purple-500 hover:underline px-1 py-0.5 rounded transition"
                      style={{background:'none'}}
                      onClick={() => setShowReplies(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                    >
                      {isRepliesOpen ? '답글 닫기' : `답글 ${c.children.length}개 보기`}
                    </button>
                  )}
                </div>
              </>
            )}
            {/* 대댓글 입력창 */}
            {isLoggedIn && replyOpen[c.id] && (
              <form onSubmit={e => { e.preventDefault(); handleReplySubmit(c.id); }} className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={replyInput[c.id] || ''}
                  onChange={e => setReplyInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder="답글을 입력하세요"
                  maxLength={200}
                  required
                />
                <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded text-sm">등록</button>
              </form>
            )}
            {/* 대댓글 */}
            {hasReplies && isRepliesOpen && c.children && c.children.length > 0 && (
              <div className="mt-1">
                {renderComments(c.children, depth + 1)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // 게시글 카드 내 이미지 클릭 핸들러
  const handleImgClick = (images, idx) => {
    setImgModal({ open: true, images, idx });
  };

  if (gymLoading) return <div className="text-center py-20 text-xl text-blue-400 animate-pulse">로딩 중...</div>;
  if (!gymData) return <div className="text-center py-20 text-xl text-red-400">체육관 정보를 불러올 수 없습니다.</div>;

  return (
    <div className="max-w-5xl mx-auto mt-6 p-2 sm:p-6 bg-white rounded-2xl shadow-xl flex flex-col">
      {/* 상단: 체육관 소개 영역 */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-8">
        {/* 왼쪽: 사진 슬라이드 */}
        <div className="md:w-1/2 w-full flex flex-col items-center">
          <div className="w-full aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group relative"
            onClick={() => gymData.gymImage && gymData.gymImage.length > 0 && setImgModal({ open: true, images: gymData.gymImage, idx: mainIdx })}>
            {gymData.gymImage && gymData.gymImage.length > 0 ? (
              <img src={gymData.gymImage[mainIdx]} alt="대표사진" className="object-cover w-full h-full transition-all duration-300 group-hover:scale-105" />
            ) : (
              <span className="text-gray-400">이미지 없음</span>
            )}
            {gymData.gymImage && gymData.gymImage.length > 1 && (
              <>
                <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-2 text-xl shadow hover:bg-blue-100 z-10" onClick={e => { e.stopPropagation(); setMainIdx((mainIdx - 1 + gymData.gymImage.length) % gymData.gymImage.length); }}><FaChevronLeft /></button>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-2 text-xl shadow hover:bg-blue-100 z-10" onClick={e => { e.stopPropagation(); setMainIdx((mainIdx + 1) % gymData.gymImage.length); }}><FaChevronRight /></button>
              </>
            )}
          </div>
          {/* 썸네일 리스트 */}
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            {gymData.gymImage && gymData.gymImage.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`썸네일${idx+1}`}
                className={`w-16 h-16 object-cover rounded border-2 cursor-pointer ${mainIdx === idx ? 'border-blue-500' : 'border-gray-200'}`}
                onClick={e => { e.stopPropagation(); setMainIdx(idx); setImgModal({ open: true, images: gymData.gymImage, idx }); }}
              />
            ))}
          </div>
        </div>
        {/* 오른쪽: 체육관 정보 */}
        <div className="md:w-1/2 w-full flex flex-col gap-4 justify-between">
          <div>
            <div className="flex items-center gap-6 mb-2 flex-wrap">
              <span className="text-3xl font-extrabold">{gymData.name}</span>
              <span className="text-base font-semibold text-gray-700">
                운영시간: <span className="text-black">{formatTime(gymData.openTime)} ~ {formatTime(gymData.closeTime)}</span>
              </span>
              {isLoggedIn && gymData.ownerId && (userInfo?.userRole === 'USER' || userInfo?.userRole === 'PENDING_OWNER') && (
                <button
                  className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-full font-bold shadow hover:bg-blue-600 transition text-base"
                  onClick={handleInquiry}
                >
                  문의하기
                </button>
              )}
            </div>
            <div className="h-3" />
            <div className="text-blue-500 font-semibold mb-2">{gymData.summary}</div>
            <div className="text-gray-700 mb-4 whitespace-pre-line">{gymData.content}</div>
          </div>
        </div>
      </div>
      {/* 토글 버튼 */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow transition border-2 ${activeTab === 'membership' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => setActiveTab('membership')}
        >
          이용권 및 트레이너
        </button>
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow transition border-2 ${activeTab === 'post' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-500 border-purple-200 hover:bg-purple-50'}`}
          onClick={() => setActiveTab('post')}
        >
          게시글
        </button>
      </div>
      {/* 탭별 내용 */}
      {activeTab === 'membership' ? (
        <div className="flex flex-col md:flex-row gap-4">
          {/* 트레이너 리스트 카드형 */}
          <div className="flex-1 bg-white rounded-xl p-4">
            <h2 className="text-xl font-bold mb-4">트레이너 목록</h2>
            <div className="flex flex-col gap-4">
              {trainers.length === 0 && <div className="text-gray-400">등록된 트레이너가 없습니다.</div>}
              {trainers.map(tr => (
                <div
                  key={tr.id}
                  className="relative rounded-xl overflow-hidden shadow border bg-white flex items-end min-h-[140px] h-[180px] cursor-pointer hover:shadow-lg transition"
                  onClick={() => { setSelectedTrainerId(tr.id); setModalOpen(true); }}
                >
                  <img
                    src={tr.trainerImage?.[0] || 'https://via.placeholder.com/300x180?text=No+Image'}
                    alt={tr.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-3 flex items-center justify-between">
                    <div className="text-white font-bold text-lg">{tr.name}</div>
                    <div className="text-white font-semibold text-base">₩{tr.price?.toLocaleString()}</div>
                    <button
                      className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-full font-bold shadow hover:bg-blue-600 transition text-base"
                      onClick={e => { e.stopPropagation(); handleOpenTrainerModal(tr.id); }}
                    >
                      예약하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 이용권 리스트 카드형 */}
          <div className="flex-1 bg-white rounded-xl p-4">
            <h2 className="text-xl font-bold mb-4">이용권 목록</h2>
            <div className="flex flex-col gap-4">
              {memberships.length === 0 && <div className="text-gray-400">등록된 이용권이 없습니다.</div>}
              {memberships.map(mb => (
                <div key={mb.id} className="p-4 bg-white rounded-xl shadow border border-purple-200 flex flex-col gap-2">
                  <div className="font-bold text-lg">{mb.name}</div>
                  <div className="text-gray-500">₩{mb.price?.toLocaleString()} / {mb.durationInDays}일</div>
                  <div className="text-gray-700 text-sm">{mb.content}</div>
                  <button
                    className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-full font-bold shadow hover:bg-purple-600 transition"
                    onClick={() => handleOpenMembershipModal(mb.id)}
                  >
                    이용권 구매하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">게시글 목록</h2>
          
          {/* 게시글 카테고리 선택 */}
          <div className="flex gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-full font-bold shadow transition border-2 ${postCategory === 'notice' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-500 border-red-200 hover:bg-red-50'}`}
              onClick={() => setPostCategory('notice')}
            >
              공지사항 ({noticePosts.length})
            </button>
            <button
              className={`px-4 py-2 rounded-full font-bold shadow transition border-2 ${postCategory === 'general' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50'}`}
              onClick={() => setPostCategory('general')}
            >
              일반게시물 ({generalPosts.length})
            </button>
          </div>

          {/* 게시글 목록 */}
          <div className="space-y-6">
            {(postCategory === 'notice' ? noticePosts : generalPosts).map(post => {
              const images = post.postImageUrl || [];
              const idx = carouselIdx[post.postId] || 0;
              const likeInfo = likeState[post.postId] || { liked: post.isLiked ?? false, count: post.likeCount ?? 0 };
              const commentCount = post.commentCount ?? 0;
              return (
                <div key={post.postId} className="bg-white rounded-xl shadow border p-4 flex flex-col gap-3 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${post.postType === 'NOTICE' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>{post.postType === 'NOTICE' ? '공지' : '일반'}</span>
                      <h3 className="font-bold text-lg">{post.title}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {/* 이미지 캐러셀 (16:9, object-cover) */}
                  {images.length > 0 && (
                    <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={images[idx]}
                        alt={`게시글이미지${idx+1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        style={{ minHeight: '180px' }}
                        onClick={() => handleImgClick(images, idx)}
                      />
                      {images.length > 1 && (
                        <div className="absolute top-1/2 left-0 right-0 flex justify-between items-center px-2">
                          <button onClick={() => handlePrevImg(post.postId, images)} className="bg-white/80 rounded-full px-2 py-1 text-xl font-bold shadow border hover:bg-blue-100">{'<'}</button>
                          <button onClick={() => handleNextImg(post.postId, images)} className="bg-white/80 rounded-full px-2 py-1 text-xl font-bold shadow border hover:bg-blue-100">{'>'}</button>
                        </div>
                      )}
                      {images.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {images.map((_, i) => (
                            <span key={i} className={`inline-block w-2 h-2 rounded-full ${i === idx ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* 내용 */}
                  <div className="text-gray-700 whitespace-pre-line text-base text-left break-words max-h-40 overflow-y-auto">{post.content}</div>
                  {/* 댓글/좋아요 아이콘 */}
                  <div className="flex justify-end items-center gap-4 mt-2">
                    <button
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-500 text-lg"
                      onClick={() => setCommentModal({ open: true, post })}
                    >
                      <FaRegCommentDots />
                      <span className="text-sm font-bold">{commentCount}</span>
                    </button>
                    <button
                      className={`flex items-center gap-1 text-lg ${likeInfo.liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                      onClick={() => handleLikeToggle(post)}
                    >
                      {likeInfo.liked ? <FaHeart /> : <FaRegHeart />}
                      <span className="text-sm font-bold">{likeInfo.count}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* 댓글 모달 */}
          {commentModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative animate-fadeIn flex flex-col">
                <button className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl font-bold" onClick={() => setCommentModal({ open: false, post: null })}>×</button>
                <h3 className="text-xl font-bold mb-4">댓글</h3>
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-[120px] max-h-[50vh]">
                  {commentLoading ? (
                    <div className="text-center text-gray-400 py-8">불러오는 중...</div>
                  ) : commentList.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">댓글이 없습니다.</div>
                  ) : (
                    renderComments(commentList)
                  )}
                </div>
                {/* 댓글 입력창 */}
                {isLoggedIn ? (
                  <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-4">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      className="flex-1 border rounded px-2 py-1"
                      placeholder="댓글을 입력하세요"
                      maxLength={200}
                      required
                    />
                    <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded">등록</button>
                  </form>
                ) : (
                  <div className="text-center text-gray-400 mt-4">로그인 후 댓글 작성이 가능합니다.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {/* 트레이너 상세 모달 */}
      {modalOpen && selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[95vh] max-h-[95vh] overflow-y-auto p-4 sm:p-10 relative animate-fadeIn flex flex-col sm:flex-row items-start gap-16">
            {/* 왼쪽: 사진 영역 */}
            <div className="flex flex-col items-center justify-center max-w-[600px] w-full mr-auto ml-[-32px]">
              <div className="flex items-center gap-2 mb-4 w-full">
                <button
                  className="text-3xl text-gray-400 hover:text-blue-500 px-2"
                  onClick={() => {
                    const len = selectedTrainer.trainerImage?.length || 0;
                    if (len > 0) setMainTrainerImgIdx((mainTrainerImgIdx - 1 + len) % len);
                  }}
                  aria-label="이전 사진"
                >
                  {'<'}
                </button>
                <img
                  ref={leftImgRef}
                  src={selectedTrainer.trainerImage?.[mainTrainerImgIdx] || 'https://via.placeholder.com/600x800?text=No+Image'}
                  alt="대표사진"
                  className="mx-auto max-h-[80vh] w-full max-w-[600px] h-auto object-contain bg-gray-100 rounded-2xl border shadow-lg"
                />
                <button
                  className="text-3xl text-gray-400 hover:text-blue-500 px-2"
                  onClick={() => {
                    const len = selectedTrainer.trainerImage?.length || 0;
                    if (len > 0) setMainTrainerImgIdx((mainTrainerImgIdx + 1) % len);
                  }}
                  aria-label="다음 사진"
                >
                  {'>'}
                </button>
              </div>
              {/* 썸네일 리스트 */}
              <div className="flex gap-2 mb-2 flex-wrap justify-center w-full">
                {(selectedTrainer.trainerImage && selectedTrainer.trainerImage.length > 0)
                  ? selectedTrainer.trainerImage.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={selectedTrainer.name + ' 썸네일' + (idx+1)}
                        className={`w-20 h-20 object-cover rounded-lg border-2 cursor-pointer transition ${mainTrainerImgIdx === idx ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}
                        onClick={() => setMainTrainerImgIdx(idx)}
                      />
                    ))
                  : <img src="https://via.placeholder.com/120x120?text=No+Image" alt="No Image" className="w-20 h-20 object-cover rounded-lg border" />
                }
              </div>
            </div>
            {/* 오른쪽: 정보 영역 */}
            <div className="flex flex-col flex-1 min-w-[320px] max-w-2xl justify-end">
              <div ref={rightCardRef}>
                <div className="flex flex-row items-start gap-4 mb-4 w-full">
                  <div className="font-extrabold text-2xl text-gray-900 flex-1 text-left">{selectedTrainer.name}</div>
                  <div className="font-semibold text-xl text-blue-500 text-right whitespace-nowrap">₩{selectedTrainer.price?.toLocaleString()}</div>
                </div>
                {/* 경력 */}
                <div className="mb-6">
                  <div className="font-bold text-gray-700 mb-1">경력</div>
                  <div className="text-gray-700 whitespace-pre-line break-words bg-gray-50 rounded-lg p-3 min-h-[40px] max-h-56 overflow-y-auto">{selectedTrainer.experience || '경력 정보 없음'}</div>
                </div>
                {/* 자기소개 */}
                <div className="mb-6">
                  <div className="font-bold text-gray-700 mb-1">자기소개</div>
                  <div className="text-gray-700 whitespace-pre-line break-words bg-gray-50 rounded-lg p-3 min-h-[300px] max-h-56 overflow-y-auto pb-16 mb-6">{selectedTrainer.content || '자기소개 정보 없음'}</div>
                </div>
              </div>
              <button
                ref={buttonRef}
                className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition text-lg mt-0"
                style={{ marginTop: buttonMargin }}
                onClick={() => { setModalOpen(false); setMainTrainerImgIdx(0); if (!isLoggedIn) { showLoginAlert(); return; } handleOpenTrainerModal(selectedTrainer.id); }}
              >
                트레이너 예약하기
              </button>
            </div>
            {/* 닫기 버튼 */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl font-bold"
              onClick={() => { setModalOpen(false); setMainTrainerImgIdx(0); }}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {/* ReservationModal 모달 */}
      {reservationModalOpen && (
        <ReservationModal
          open={reservationModalOpen}
          onClose={handleCloseReservationModal}
          type={reservationType}
          gymId={paramGymId}
          membershipId={selectedMembershipId}
          trainerId={selectedTrainerId}
        />
      )}
      {/* 이미지 원본 모달 */}
      {imgModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setImgModal({ open: false, images: [], idx: 0 })}>
          <div className="relative max-w-3xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-white text-3xl font-bold z-10" onClick={() => setImgModal({ open: false, images: [], idx: 0 })}>×</button>
            <img
              src={imgModal.images[imgModal.idx]}
              alt="원본이미지"
              className="max-h-[80vh] w-auto object-contain rounded-xl bg-white"
              style={{ maxWidth: '90vw' }}
            />
            {imgModal.images.length > 1 && (
              <div className="flex gap-4 mt-4">
                <button onClick={() => setImgModal(m => ({ ...m, idx: (m.idx - 1 + m.images.length) % m.images.length }))} className="text-white text-2xl px-4 py-2 bg-black/30 rounded-full">{'<'}</button>
                <button onClick={() => setImgModal(m => ({ ...m, idx: (m.idx + 1) % m.images.length }))} className="text-white text-2xl px-4 py-2 bg-black/30 rounded-full">{'>'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GymDetail; 