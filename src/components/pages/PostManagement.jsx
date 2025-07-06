import { useState, useEffect } from 'react';
import { api } from '../../api/http';
import { createPost, getGeneralPosts, updatePost } from '../../api/posts';
import { getMyGyms } from '../../api/gyms';

export default function PostManagement() {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'edit' | 'delete'
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    postType: 'GENERAL', // 'GENERAL' | 'NOTICE'
    status: 'ACTIVE', // 'ACTIVE' | 'INACTIVE'
    postImage: [] // S3 URL 배열
  });
  const [imgPreviews, setImgPreviews] = useState([]); // 미리보기 URL 배열
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editGym, setEditGym] = useState(null);
  const [editPosts, setEditPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    postType: 'GENERAL',
    status: 'ACTIVE',
    postImage: []
  });
  const [editImgPreviews, setEditImgPreviews] = useState([]);
  const [oldImages, setOldImages] = useState([]); // 기존 이미지 URL 배열
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteGym, setDeleteGym] = useState(null);
  const [deletePosts, setDeletePosts] = useState([]);
  const [selectedDeletePost, setSelectedDeletePost] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // 내 체육관 목록 불러오기
  useEffect(() => {
    getMyGyms().then(res => {
      setGyms(Array.isArray(res.data.data) ? res.data.data : []);
    });
  }, []);

  // 체육관 선택 시 해당 체육관의 게시글 목록 불러오기
  useEffect(() => {
    if (activeTab === 'edit' && editGym) {
      getGeneralPosts(editGym.value).then(res => {
        const posts = Array.isArray(res.data?.content) ? res.data.content : [];
        setEditPosts(posts);
      });
    } else {
      setEditPosts([]);
    }
  }, [activeTab, editGym]);

  // 게시글 선택 시 폼 자동입력 및 이미지 미리보기
  useEffect(() => {
    if (activeTab === 'edit' && selectedPost) {
      setEditForm({
        title: selectedPost.title || '',
        content: selectedPost.content || '',
        postType: selectedPost.postType || 'GENERAL',
        status: selectedPost.status || 'ACTIVE',
        postImage: selectedPost.postImageUrl || [],
      });
      setEditImgPreviews(selectedPost.postImageUrl || []);
      setOldImages(selectedPost.postImageUrl || []);
    } else if (activeTab === 'edit') {
      setEditForm({ title: '', content: '', postType: 'GENERAL', status: 'ACTIVE', postImage: [] });
      setEditImgPreviews([]);
      setOldImages([]);
    }
  }, [activeTab, selectedPost]);

  // 삭제 탭: 체육관 선택 시 게시글 목록 불러오기
  useEffect(() => {
    if (activeTab === 'delete' && deleteGym) {
      getGeneralPosts(deleteGym.value).then(res => {
        const posts = Array.isArray(res.data?.content) ? res.data.content : [];
        setDeletePosts(posts);
      });
    } else {
      setDeletePosts([]);
    }
  }, [activeTab, deleteGym]);

  // presigned url 방식 이미지 업로드 (여러 장, 프론트에서 S3 직접 업로드)
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // 미리보기 먼저 추가
    const previews = files.map(file => URL.createObjectURL(file));
    setImgPreviews(prev => [...prev, ...previews]);
    
    // S3 업로드
    for (const file of files) {
      try {
        const res = await api.get('/images/presigned-url', {
          params: { filename: file.name, contentType: file.type }
        });
        const { presignedUrl, fileName } = res.data.data;
        await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        const s3Url = `https://fit-pass-1.s3.ap-northeast-2.amazonaws.com/${fileName}`;
        setForm(prev => ({ ...prev, postImage: [...prev.postImage, s3Url] }));
      } catch (err) {
        alert('이미지 업로드 중 오류 발생');
      }
    }
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = async (idx) => {
    const url = form.postImage[idx];
    // S3에서 삭제
    try {
      await api.delete('/images', { params: { images: url } });
    } catch {
      alert('이미지 삭제 중 오류 발생');
      return;
    }
    // 프론트 상태에서 삭제
    setImgPreviews(prev => prev.filter((_, i) => i !== idx));
    setForm(prev => ({ ...prev, postImage: prev.postImage.filter((_, i) => i !== idx) }));
  };

  // presigned 방식 신규 이미지 업로드
  const handleEditImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const previews = files.map(file => URL.createObjectURL(file));
    setEditImgPreviews(prev => [...prev, ...previews]);
    for (const file of files) {
      try {
        const res = await api.get('/images/presigned-url', {
          params: { filename: file.name, contentType: file.type }
        });
        const { presignedUrl, fileName } = res.data.data;
        await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        const s3Url = `https://fit-pass-1.s3.ap-northeast-2.amazonaws.com/${fileName}`;
        setEditForm(prev => ({ ...prev, postImage: [...prev.postImage, s3Url] }));
      } catch (err) {
        alert('이미지 업로드 중 오류 발생');
      }
    }
  };

  // 이미지 삭제 핸들러 (기존/신규 분리)
  const handleEditImageDelete = async (idx) => {
    const url = editForm.postImage[idx];
    if (oldImages.includes(url)) {
      if (!window.confirm('이 이미지를 삭제하시겠습니까?')) return;
      try {
        await api.delete('/images', { params: { images: url } });
        setOldImages(prev => prev.filter(img => img !== url));
      } catch {
        alert('이미지 삭제 중 오류 발생');
        return;
      }
    }
    setEditImgPreviews(prev => prev.filter((_, i) => i !== idx));
    setEditForm(prev => ({ ...prev, postImage: prev.postImage.filter((_, i) => i !== idx) }));
  };

  // 게시글 등록
  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!selectedGym) {
      setError('체육관을 선택해 주세요.');
      setLoading(false);
      return;
    }
    
    if (!form.title || !form.content) {
      setError('제목과 내용을 모두 입력해 주세요.');
      setLoading(false);
      return;
    }

    try {
      await createPost(selectedGym.value, {
        status: form.status,
        postType: form.postType,
        title: form.title,
        content: form.content,
        postImage: form.postImage
      });
      
      alert('게시글이 등록되었습니다!');
      // 폼 초기화
      setForm({
        title: '',
        content: '',
        postType: 'GENERAL',
        status: 'ACTIVE',
        postImage: []
      });
      setImgPreviews([]);
    } catch (err) {
      setError('게시글 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 게시글 수정
  const handleEditPost = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    if (!editGym || !selectedPost) {
      setEditError('체육관과 게시글을 모두 선택해 주세요.');
      setEditLoading(false);
      return;
    }
    if (!editForm.title || !editForm.content) {
      setEditError('제목과 내용을 모두 입력해 주세요.');
      setEditLoading(false);
      return;
    }
    try {
      await updatePost(editGym.value, selectedPost.postId, {
        status: editForm.status,
        postType: editForm.postType,
        title: editForm.title,
        content: editForm.content,
        postImage: editForm.postImage
      });
      alert('게시글이 수정되었습니다!');
      setSelectedPost(null);
      setEditForm({ title: '', content: '', postType: 'GENERAL', status: 'ACTIVE', postImage: [] });
      setEditImgPreviews([]);
      setOldImages([]);
      // 목록 새로고침
      getGeneralPosts(editGym.value).then(res => {
        const posts = Array.isArray(res.data?.content) ? res.data.content : [];
        setEditPosts(posts);
      });
    } catch (err) {
      setEditError('게시글 수정에 실패했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteLoading(true);
    if (!deleteGym || !selectedDeletePost) {
      setDeleteError('체육관과 게시글을 모두 선택해 주세요.');
      setDeleteLoading(false);
      return;
    }
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      setDeleteLoading(false);
      return;
    }
    try {
      await api.delete(`/gyms/${deleteGym.value}/posts/${selectedDeletePost.postId}`);
      alert('게시글이 삭제되었습니다!');
      setSelectedDeletePost(null);
      // 목록 새로고침
      getGeneralPosts(deleteGym.value).then(res => {
        const posts = Array.isArray(res.data?.content) ? res.data.content : [];
        setDeletePosts(posts);
      });
    } catch (err) {
      setDeleteError('게시글 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-center">게시글 관리</h1>
      <div className="flex gap-4 justify-center mb-8">
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow transition border-2 ${activeTab === 'create' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => setActiveTab('create')}
        >
          게시글 등록
        </button>
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow transition border-2 ${activeTab === 'edit' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-500 border-purple-200 hover:bg-purple-50'}`}
          onClick={() => setActiveTab('edit')}
        >
          게시글 수정
        </button>
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow transition border-2 ${activeTab === 'delete' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-500 border-red-200 hover:bg-red-50'}`}
          onClick={() => setActiveTab('delete')}
        >
          게시글 삭제
        </button>
      </div>
      
      {/* 탭별 내용 */}
      {activeTab === 'create' && (
        <div className="bg-blue-50 rounded-xl p-8">
          <h2 className="text-xl font-bold mb-6 text-center text-blue-700">게시글 등록</h2>
          
          <form onSubmit={handleCreatePost} className="space-y-5">
            {/* 체육관 선택 */}
            <div>
              <label className="block font-bold mb-2">체육관 선택</label>
              <select
                value={selectedGym?.value || ''}
                onChange={(e) => {
                  const gym = gyms.find(g => String(g.id || g.gymId || g._id) === e.target.value);
                  setSelectedGym(gym ? { value: gym.id || gym.gymId || gym._id, label: gym.name } : null);
                }}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              >
                <option value="">체육관을 선택하세요</option>
                {gyms.map((gym) => (
                  <option key={gym.id || gym.gymId || gym._id} value={gym.id || gym.gymId || gym._id}>
                    {gym.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 게시글 타입 선택 */}
            <div>
              <label className="block font-bold mb-2">게시글 타입</label>
              <select
                value={form.postType}
                onChange={(e) => setForm(prev => ({ ...prev, postType: e.target.value }))}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              >
                <option value="GENERAL">일반 게시글</option>
                <option value="NOTICE">공지사항</option>
              </select>
            </div>

            {/* 게시글 상태 선택 */}
            <div>
              <label className="block font-bold mb-2">게시글 상태</label>
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              >
                <option value="ACTIVE">공개</option>
                <option value="INACTIVE">비공개</option>
              </select>
            </div>

            {/* 제목 */}
            <input
              type="text"
              placeholder="게시글 제목 (50자 이내)"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
              maxLength={50}
              required
            />

            {/* 내용 */}
            <textarea
              placeholder="게시글 내용"
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none resize-none"
              rows={6}
              required
            />

            {/* 이미지 업로드/미리보기 */}
            <div>
              <label className="block font-bold mb-2">사진 업로드 (여러 장 가능)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {imgPreviews.map((url, idx) => (
                  <div key={url} className="relative inline-block">
                    <img
                      src={url}
                      alt={`미리보기${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border-2"
                      onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/80?text=No+Image'; }}
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-500 hover:bg-red-100 border border-red-300"
                      onClick={() => handleImageDelete(idx)}
                      style={{ transform: 'translate(40%,-40%)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="text-red-500 font-bold text-center">{error}</div>}
            
            <button 
              type="submit" 
              className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition"
              disabled={loading}
            >
              {loading ? '등록 중...' : '게시글 등록'}
            </button>
          </form>
        </div>
      )}
      
      {activeTab === 'edit' && (
        <div className="bg-purple-50 rounded-xl p-8">
          <h2 className="text-xl font-bold mb-6 text-center text-purple-700">게시글 수정</h2>
          <form onSubmit={handleEditPost} className="space-y-5">
            {/* 체육관 선택 */}
            <div>
              <label className="block font-bold mb-2">체육관 선택</label>
              <select
                value={editGym?.value || ''}
                onChange={(e) => {
                  const gym = gyms.find(g => String(g.id || g.gymId || g._id) === e.target.value);
                  setEditGym(gym ? { value: gym.id || gym.gymId || gym._id, label: gym.name } : null);
                  setSelectedPost(null);
                }}
                className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              >
                <option value="">체육관을 선택하세요</option>
                {gyms.map((gym) => (
                  <option key={gym.id || gym.gymId || gym._id} value={gym.id || gym.gymId || gym._id}>
                    {gym.name}
                  </option>
                ))}
              </select>
            </div>
            {/* 게시글 선택 */}
            <div>
              <label className="block font-bold mb-2">게시글 선택</label>
              <select
                value={selectedPost?.postId || ''}
                onChange={(e) => {
                  const post = editPosts.find(p => String(p.postId) === e.target.value);
                  setSelectedPost(post || null);
                }}
                className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
                disabled={!editGym}
              >
                <option value="">게시글을 선택하세요</option>
                {editPosts.map((post) => (
                  <option key={post.postId} value={post.postId}>{post.title}</option>
                ))}
              </select>
            </div>
            {/* 게시글 타입/상태/제목/내용/이미지 */}
            <div>
              <label className="block font-bold mb-2">게시글 타입</label>
              <select
                value={editForm.postType}
                onChange={(e) => setEditForm(prev => ({ ...prev, postType: e.target.value }))}
                className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              >
                <option value="GENERAL">일반 게시글</option>
                <option value="NOTICE">공지사항</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-2">게시글 상태</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              >
                <option value="ACTIVE">공개</option>
                <option value="INACTIVE">비공개</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="게시글 제목 (50자 이내)"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-lg px-4 py-3 transition-all outline-none"
              maxLength={50}
              required
            />
            <textarea
              placeholder="게시글 내용"
              value={editForm.content}
              onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-lg px-4 py-3 transition-all outline-none resize-none"
              rows={6}
              required
            />
            {/* 이미지 업로드/미리보기 */}
            <div>
              <label className="block font-bold mb-2">사진 업로드 (여러 장 가능)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditImageChange}
                className="w-full"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {editImgPreviews.map((url, idx) => (
                  <div key={url} className="relative inline-block">
                    <img
                      src={url}
                      alt={`미리보기${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border-2"
                      onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/80?text=No+Image'; }}
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-500 hover:bg-red-100 border border-red-300"
                      onClick={() => handleEditImageDelete(idx)}
                      style={{ transform: 'translate(40%,-40%)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {editError && <div className="text-red-500 font-bold text-center">{editError}</div>}
            <button
              type="submit"
              className="w-full bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 transition"
              disabled={editLoading}
            >
              {editLoading ? '수정 중...' : '게시글 수정'}
            </button>
          </form>
        </div>
      )}
      
      {activeTab === 'delete' && (
        <div className="bg-red-50 rounded-xl p-8">
          <h2 className="text-xl font-bold mb-6 text-center text-red-700">게시글 삭제</h2>
          <form onSubmit={handleDeletePost} className="space-y-5">
            {/* 체육관 선택 */}
            <div>
              <label className="block font-bold mb-2">체육관 선택</label>
              <select
                value={deleteGym?.value || ''}
                onChange={(e) => {
                  const gym = gyms.find(g => String(g.id || g.gymId || g._id) === e.target.value);
                  setDeleteGym(gym ? { value: gym.id || gym.gymId || gym._id, label: gym.name } : null);
                  setSelectedDeletePost(null);
                }}
                className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              >
                <option value="">체육관을 선택하세요</option>
                {gyms.map((gym) => (
                  <option key={gym.id || gym.gymId || gym._id} value={gym.id || gym.gymId || gym._id}>
                    {gym.name}
                  </option>
                ))}
              </select>
            </div>
            {/* 게시글 선택 */}
            <div>
              <label className="block font-bold mb-2">게시글 선택</label>
              <select
                value={selectedDeletePost?.postId || ''}
                onChange={(e) => {
                  const post = deletePosts.find(p => String(p.postId) === e.target.value);
                  setSelectedDeletePost(post || null);
                }}
                className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
                disabled={!deleteGym}
              >
                <option value="">게시글을 선택하세요</option>
                {deletePosts.map((post) => (
                  <option key={post.postId} value={post.postId}>{post.title}</option>
                ))}
              </select>
            </div>
            {deleteError && <div className="text-red-500 font-bold text-center">{deleteError}</div>}
            <button
              type="submit"
              className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition"
              disabled={deleteLoading}
            >
              {deleteLoading ? '삭제 중...' : '게시글 삭제'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 