import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { getMyGyms } from '../../api/gyms';
import { api } from '../../api/http';

function TrainerRegister() {
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', content: '', experience: '', images: [] });
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [mode, setMode] = useState('register'); // 'register' | 'edit' | 'delete'
  const [error, setError] = useState('');
  const [imgFiles, setImgFiles] = useState([]); // File 객체 배열
  const [imgPreviews, setImgPreviews] = useState([]); // 미리보기 URL 배열
  const [showContinueModal, setShowContinueModal] = useState(false); // 등록 후 모달
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // 내 체육관 목록 불러오기
  useEffect(() => {
    getMyGyms().then(res => {
      setGyms(Array.isArray(res.data.data) ? res.data.data : []);
    });
  }, []);

  // 트레이너 목록 불러오기
  useEffect(() => {
    if (selectedGym) {
      api.get(`/gyms/${selectedGym.value}/trainers`).then(res => {
        setTrainers(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.data?.content) ? res.data.data.content : []));
      });
    } else {
      setTrainers([]);
    }
  }, [selectedGym]);

  // 트레이너 선택 시 폼 자동입력 및 이미지 미리보기
  useEffect(() => {
    if (mode === 'edit' && selectedTrainer) {
      setForm({
        name: selectedTrainer.name || '',
        price: selectedTrainer.price || '',
        content: selectedTrainer.content || '',
        experience: selectedTrainer.experience || '',
        images: selectedTrainer.images || [],
      });
      setImgPreviews(selectedTrainer.images || []);
      setImgFiles([]); // 새로 업로드한 파일은 없음
    } else if (mode === 'register') {
      setForm({ name: '', price: '', content: '', experience: '', images: [] });
      setSelectedTrainer(null);
      setImgFiles([]);
      setImgPreviews([]);
    }
  }, [mode, selectedTrainer]);

  // 이미지 파일 업로드 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setImgFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImgPreviews(prev => [...prev, ...newPreviews]);
  };

  // 이미지 미리보기 삭제
  const handleImageDelete = (idx, isExisting) => {
    if (isExisting) {
      // 기존 이미지 삭제
      setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
      setImgPreviews(prev => prev.filter((_, i) => i !== idx));
    } else {
      // 새로 업로드한 파일 삭제
      setImgFiles(prev => prev.filter((_, i) => i !== (idx - form.images.length)));
      setImgPreviews(prev => prev.filter((_, i) => i !== idx));
    }
  };

  // 등록
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym) return setError('체육관을 선택해 주세요.');
    if (!form.name || !form.price || !form.content || !form.experience) return setError('모든 항목을 입력해 주세요.');
    try {
      // 이미지 업로드 (여러 장)
      let uploadedUrls = [];
      if (imgFiles.length > 0) {
        const formData = new FormData();
        imgFiles.forEach(file => formData.append('images', file));
        const res = await api.post(`/images/multi`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedUrls = res.data.data;
      }
      await api.post(`/gyms/${selectedGym.value}/trainers`, {
        name: form.name,
        price: form.price,
        content: form.content,
        experience: form.experience,
        trainerImage: [...form.images, ...uploadedUrls],
      });
      // 등록 성공 시 모달 표시
      setShowContinueModal(true);
      setForm({ name: '', price: '', content: '', experience: '', images: [] });
      setImgFiles([]);
      setImgPreviews([]);
      // 목록 새로고침
      const res = await api.get(`/gyms/${selectedGym.value}/trainers`);
      setTrainers(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.data?.content) ? res.data.data.content : []));
    } catch {
      setError('트레이너 등록 실패');
    }
  };

  // 수정
  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym || !selectedTrainer) return setError('수정할 트레이너를 선택해 주세요.');
    try {
      // 새로 업로드한 이미지가 있으면 업로드
      let uploadedUrls = [];
      if (imgFiles.length > 0) {
        const formData = new FormData();
        imgFiles.forEach(file => formData.append('images', file));
        const res = await api.post(`/images/multi`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedUrls = res.data.data;
      }
      await api.patch(`/gyms/${selectedGym.value}/trainers/${selectedTrainer.id}`, {
        name: form.name,
        price: form.price,
        content: form.content,
        experience: form.experience,
        trainerImage: [...form.images, ...uploadedUrls],
      });
      alert('트레이너 정보 수정 완료!');
      setForm({ name: '', price: '', content: '', experience: '', images: [] });
      setSelectedTrainer(null);
      setMode('register');
      setImgFiles([]);
      setImgPreviews([]);
      // 목록 새로고침
      const res = await api.get(`/gyms/${selectedGym.value}/trainers`);
      setTrainers(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.data?.content) ? res.data.data.content : []));
    } catch {
      setError('트레이너 수정 실패');
    }
  };

  // 삭제
  const handleDelete = async (trainerId) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/gyms/${selectedGym.value}/trainers/${trainerId}`);
      alert('트레이너 삭제 완료!');
      setSelectedTrainer(null);
      setMode('register');
      setForm({ name: '', price: '', content: '', experience: '', images: [] });
      setImgFiles([]);
      setImgPreviews([]);
      // 목록 새로고침
      const res = await api.get(`/gyms/${selectedGym.value}/trainers`);
      setTrainers(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.data?.content) ? res.data.data.content : []));
    } catch {
      alert('트레이너 삭제 실패');
    }
  };

  const gymOptions = gyms.map(gym => ({ value: gym.id || gym.gymId || gym._id, label: gym.name, ...gym }));
  const trainerOptions = trainers.map(tr => ({ value: tr.id, label: tr.name, ...tr }));

  return (
    <div className="max-w-xl mx-auto bg-white/90 p-10 rounded-2xl shadow-2xl mt-12 flex flex-col items-center">
      <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text drop-shadow">
        트레이너 관리
      </h1>
      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-6 w-full">
        <button type="button" className={`flex-1 py-2 rounded font-bold ${mode === 'register' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setMode('register')}>등록</button>
        <button type="button" className={`flex-1 py-2 rounded font-bold ${mode === 'edit' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setMode('edit')}>수정</button>
        <button type="button" className={`flex-1 py-2 rounded font-bold ${mode === 'delete' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setMode('delete')}>삭제</button>
      </div>
      <div className="mb-4 w-full">
        <label htmlFor="gym-select" className="block font-semibold mb-1">내 체육관 선택</label>
        <Select
          inputId="gym-select"
          options={gymOptions}
          value={gymOptions.find(opt => opt.value === selectedGym?.value) || null}
          onChange={option => setSelectedGym(option)}
          placeholder="내 체육관 선택"
          isClearable
          menuPlacement="auto"
        />
      </div>
      {/* 트레이너 선택 (수정/삭제 모드에서만) */}
      {mode !== 'register' && (
        <div className="mb-4 w-full">
          <label htmlFor="trainer-select" className="block font-semibold mb-1">트레이너 선택</label>
          <Select
            inputId="trainer-select"
            options={trainerOptions}
            value={trainerOptions.find(opt => opt.value === selectedTrainer?.id) || null}
            onChange={option => setSelectedTrainer(option)}
            placeholder="트레이너 선택"
            isClearable
            menuPlacement="auto"
          />
        </div>
      )}
      {/* 등록/수정 폼 */}
      {(mode === 'register' || (mode === 'edit' && selectedTrainer)) && (
        <form onSubmit={mode === 'register' ? handleRegister : handleEdit} className="space-y-5 w-full">
          <input
            type="text"
            name="name"
            placeholder="이름"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border-2 border-pink-200 focus:border-pink-500 rounded-lg px-4 py-3 transition-all outline-none"
            required
          />
          <input
            type="number"
            name="price"
            placeholder="가격"
            value={form.price}
            onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
            className="w-full border-2 border-pink-200 focus:border-pink-500 rounded-lg px-4 py-3 transition-all outline-none"
            required
          />
          <textarea
            name="experience"
            placeholder="경력 (예: 10년, 전 국가대표 등)"
            value={form.experience}
            onChange={e => setForm(prev => ({ ...prev, experience: e.target.value }))}
            className="w-full border-2 border-pink-200 focus:border-pink-500 rounded-lg px-4 py-3 transition-all outline-none resize-none"
            rows={2}
            required
          />
          <textarea
            name="content"
            placeholder="트레이너 소개 (200자 이내)"
            value={form.content}
            onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
            className="w-full border-2 border-pink-200 focus:border-pink-500 rounded-lg px-4 py-3 transition-all outline-none resize-none"
            rows={3}
            maxLength={200}
            required
          />
          {/* 이미지 업로드/미리보기 */}
          <div>
            <label className="block font-bold mb-2">사진 업로드 (여러 장 가능, 첫 번째가 대표)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleImageChange}
              className="w-full"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {/* 기존 이미지 미리보기 */}
              {form.images && form.images.map((url, idx) => (
                <div key={url} className="relative inline-block">
                  <img
                    src={url}
                    alt={url ? `미리보기${idx + 1}` : '이미지 없음'}
                    className={`w-20 h-20 object-cover rounded-lg border-2 border-blue-200`}
                    onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/80?text=No+Image'; }}
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-500 hover:bg-red-100 border border-red-300"
                    onClick={() => handleImageDelete(idx, true)}
                    style={{ transform: 'translate(40%,-40%)' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* 새로 업로드한 이미지 미리보기 */}
              {imgPreviews.slice(form.images.length).map((url, idx) => (
                <div key={url} className="relative inline-block">
                  <img
                    src={url}
                    alt={`업로드 미리보기${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-pink-300"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-500 hover:bg-red-100 border border-red-300"
                    onClick={() => handleImageDelete(idx + form.images.length, false)}
                    style={{ transform: 'translate(40%,-40%)' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          {error && <div className="text-red-500 font-bold text-center">{error}</div>}
          {mode === 'register' && <button type="submit" className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 transition">트레이너 등록</button>}
          {mode === 'edit' && <button type="submit" className="w-full bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 transition">트레이너 수정</button>}
        </form>
      )}
      {/* 삭제 모드 */}
      {mode === 'delete' && (
        <div className="w-full">
          <label htmlFor="trainer-select-delete" className="block font-semibold mb-1">트레이너 선택</label>
          <Select
            inputId="trainer-select-delete"
            options={trainerOptions}
            value={trainerOptions.find(opt => opt.value === selectedTrainer?.id) || null}
            onChange={option => setSelectedTrainer(option)}
            placeholder="트레이너 선택"
            isClearable
            menuPlacement="auto"
          />
          <button
            type="button"
            className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition mt-4"
            disabled={!selectedTrainer}
            onClick={() => selectedTrainer && handleDelete(selectedTrainer.id)}
          >
            트레이너 삭제
          </button>
        </div>
      )}
      {/* 등록 후 계속 등록 모달 */}
      {showContinueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-xs w-full">
            <div className="text-xl font-bold mb-4 text-center">트레이너 등록이 완료되었습니다.<br/>계속 등록하시겠습니까?</div>
            <div className="flex gap-4 mt-2">
              <button
                className="px-6 py-2 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600 transition"
                onClick={() => setShowContinueModal(false)}
              >
                예
              </button>
              <button
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition"
                onClick={() => { setShowContinueModal(false); navigate('/mypage'); }}
              >
                아니요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerRegister;
