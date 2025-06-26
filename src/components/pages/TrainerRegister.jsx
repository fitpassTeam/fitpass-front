import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyGyms } from '../../api/gyms';
import Select from 'react-select';

function TrainerRegister() {
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerMode, setTrainerMode] = useState('register'); // 'register' | 'edit' | 'delete'
  const [trainerForm, setTrainerForm] = useState({
    name: '',
    price: '',
    content: '',
    trainerImage: [],
  });
  const [trainerImageUrls, setTrainerImageUrls] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // trainerOptions 선언을 useEffect보다 위에 위치시킴
  console.log('trainers[0]:', trainers[0]);
  const trainerOptions = trainers.map(tr => ({
    value: tr.id !== undefined ? tr.id : (tr.trainer_id !== undefined ? tr.trainer_id : tr.trainerId),
    label: `${tr.name} (₩${tr.price})`,
    image: tr.trainerImage && tr.trainerImage.length > 0 ? tr.trainerImage[0] : undefined,
    ...tr,
  }));

  const trainerStatusOptions = [
    { value: 'ACTIVE', label: '활성(ACTIVE)' },
    { value: 'HOLIDAY', label: '휴가(HOLIDAY)' },
    { value: 'DELETED', label: '삭제(DELETED)' },
  ];

  // 내 체육관 목록 불러오기
  useEffect(() => {
    getMyGyms().then(res => {
      setGyms(Array.isArray(res.data.data) ? res.data.data : []);
    });
  }, []);

  // 체육관 선택 시 해당 체육관의 트레이너 목록 불러오기
  useEffect(() => {
    if (!selectedGym) {
      setTrainers([]);
      setSelectedTrainer(null);
      return;
    }
    async function fetchTrainers() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/gyms/${selectedGym.value}/trainers`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        console.log('트레이너 API 응답:', data);
        setTrainers(Array.isArray(data.data?.content) ? data.data.content : []);
      } catch {
        setTrainers([]);
      }
    }
    fetchTrainers();
  }, [selectedGym]);

  // 트레이너 선택 시 단건조회로 폼 자동입력 (edit/delete 모드에서만)
  useEffect(() => {
    if (trainerMode === 'edit' && selectedGym && selectedTrainer && selectedTrainer.value) {
      (async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:8080/gyms/${selectedGym.value}/trainers/${selectedTrainer.value}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.data) {
            setTrainerForm({
              name: data.data.name,
              price: data.data.price,
              content: data.data.content,
              trainerImage: data.data.trainerImage || [],
            });
            setTrainerImageUrls(data.data.trainerImage || []);
          }
        } catch {
          // ignore
        }
      })();
    } else if (trainerMode === 'register') {
      setTrainerForm({ name: '', price: '', content: '', trainerImage: [] });
      setTrainerImageUrls([]);
      setSelectedTrainer(null);
    }
  }, [trainerMode, selectedTrainer, selectedGym, trainers]);

  // 트레이너 이미지 업로드
  const handleTrainerImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/images/multi', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.statusCode === 200 && Array.isArray(data.data)) {
        setTrainerImageUrls(prev => [...prev, ...data.data]);
        setTrainerForm(prev => ({ ...prev, trainerImage: [...prev.trainerImage, ...data.data] }));
      } else {
        alert('이미지 업로드 실패');
      }
    } catch (err) {
      alert('이미지 업로드 중 오류 발생');
    }
  };

  // 트레이너 이미지 수정 핸들러 (edit mode 전용)
  const handleTrainerImageUpdate = async (e) => {
    const trainerId = selectedTrainer?.value || selectedTrainer?.trainerId;
    console.log('selectedTrainer:', selectedTrainer, 'trainerId:', trainerId);
    if (!selectedGym || !trainerId) {
      alert('트레이너를 먼저 선택해 주세요.');
      return;
    }
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:8080/gyms/${selectedGym.value}/trainers/${trainerId}/photo`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await res.json();
      if (data.statusCode === 200 && Array.isArray(data.data)) {
        setTrainerImageUrls(data.data);
        setTrainerForm(prev => ({ ...prev, trainerImage: data.data }));
        alert('트레이너 이미지가 수정되었습니다!');
      } else {
        alert('이미지 수정 실패');
      }
    } catch (e) {
      alert('이미지 수정 실패');
    }
  };

  // 트레이너 이미지 삭제 (프론트에서만 관리, S3 삭제 API가 없으면)
  const handleTrainerImageDelete = (url) => {
    setTrainerImageUrls(prev => prev.filter(img => img !== url));
    setTrainerForm(prev => ({ ...prev, trainerImage: prev.trainerImage.filter(img => img !== url) }));
  };

  // 트레이너 등록/수정/삭제 핸들러
  const handleTrainerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym) {
      setError('체육관을 선택해 주세요.');
      return;
    }
    if (trainerMode === 'register') {
      if (!trainerForm.name || !trainerForm.price || !trainerForm.content || trainerForm.trainerImage.length === 0) {
        setError('모든 필수 항목을 입력해 주세요.');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/gyms/${selectedGym.value}/trainers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trainerForm.name,
            price: Number(trainerForm.price),
            content: trainerForm.content,
            trainerImage: trainerForm.trainerImage,
          }),
        });
        const data = await res.json();
        if (data.statusCode === 201) {
          alert('트레이너 생성이 완료되었습니다!');
          navigate('/mypage');
        } else {
          setError('트레이너 등록에 실패했습니다.');
        }
      } catch (err) {
        setError('트레이너 등록 중 오류 발생');
      }
    } else if (trainerMode === 'edit') {
      if (!selectedTrainer) {
        setError('수정할 트레이너를 선택해 주세요.');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        // trainerImage는 항상 trainerImageUrls로 동기화
        const res = await fetch(`http://localhost:8080/gyms/${selectedGym.value}/trainers/${selectedTrainer.value}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trainerForm.name,
            price: Number(trainerForm.price),
            content: trainerForm.content,
            trainerImage: trainerImageUrls,
          }),
        });
        const data = await res.json();
        if (data.statusCode === 200) {
          alert('트레이너 정보가 수정되었습니다!');
          navigate('/mypage');
        } else {
          setError('트레이너 수정에 실패했습니다.');
        }
      } catch (err) {
        setError('트레이너 수정 중 오류 발생');
      }
    } else if (trainerMode === 'delete') {
      if (!selectedTrainer) {
        setError('삭제할 트레이너를 선택해 주세요.');
        return;
      }
      if (!window.confirm('정말로 삭제하시겠습니까?')) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/gyms/${selectedGym.value}/trainers/${selectedTrainer.value}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.status === 200 || res.status === 204) {
          alert('트레이너가 삭제되었습니다!');
          navigate('/mypage');
        } else {
          setError('트레이너 삭제에 실패했습니다.');
        }
      } catch (err) {
        setError('트레이너 삭제 중 오류 발생');
      }
    }
  };

  // 옵션
  const gymOptions = gyms.map(gym => ({
    value: gym.gymId,
    label: `${gym.name} (${gym.address})`,
    image: gym.gymImage && gym.gymImage.length > 0 ? gym.gymImage[0] : undefined,
    ...gym,
  }));
  console.log('trainerOptions:', trainerOptions);
  console.log('selectedTrainer:', selectedTrainer);

  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="bg-white/90 p-10 rounded-2xl shadow-2xl flex flex-col items-center">
        <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text drop-shadow">
          트레이너 관리
        </h1>
        <form onSubmit={handleTrainerSubmit} className="space-y-5 w-full">
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setTrainerMode('register')} className={`px-4 py-2 rounded ${trainerMode === 'register' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}>등록</button>
            <button type="button" onClick={() => setTrainerMode('edit')} className={`px-4 py-2 rounded ${trainerMode === 'edit' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}>수정</button>
            <button type="button" onClick={() => setTrainerMode('delete')} className={`px-4 py-2 rounded ${trainerMode === 'delete' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}>삭제</button>
          </div>
          <div className="w-full">
            <label htmlFor="gym-select" className="block font-bold mb-2">내 체육관 선택</label>
            <Select
              inputId="gym-select"
              options={gymOptions}
              value={selectedGym}
              onChange={option => { setSelectedGym(option); setSelectedTrainer(null); }}
              placeholder="체육관 선택"
              isClearable
              menuPlacement="auto"
              formatOptionLabel={option => (
                <div className="flex items-center gap-2">
                  {option.image && <img src={option.image} alt="gym" className="w-8 h-8 rounded object-cover border" />}
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>
          {(trainerMode === 'edit' || trainerMode === 'delete') && selectedGym && (
            <div className="w-full">
              <label htmlFor="trainer-select" className="block font-bold mb-2">트레이너 선택</label>
              <Select
                inputId="trainer-select"
                options={trainerOptions}
                value={selectedTrainer}
                onChange={option => setSelectedTrainer(option)}
                placeholder="트레이너 선택"
                isClearable
                menuPlacement="auto"
                formatOptionLabel={option => (
                  <div className="flex items-center gap-2">
                    {option.image && <img src={option.image} alt="trainer" className="w-8 h-8 rounded object-cover border" />}
                    <span>{option.label}</span>
                  </div>
                )}
              />
              {trainerOptions.length === 0 && (
                <div className="text-gray-400 text-sm mt-2">등록된 트레이너가 없습니다.</div>
              )}
            </div>
          )}
          {trainerMode === 'delete' && selectedGym && (
            <div className="w-full mt-2 text-sm text-gray-500">삭제할 트레이너를 선택하세요.</div>
          )}
          {(trainerMode === 'register' || (trainerMode === 'edit' && selectedTrainer)) && selectedGym && (
            <>
              <label htmlFor="trainer-name" className="block font-bold mb-2">트레이너 이름</label>
              <input
                id="trainer-name"
                type="text"
                name="name"
                placeholder="트레이너 이름"
                value={trainerForm.name}
                onChange={e => setTrainerForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border-2 border-pink-200 focus:border-pink-500 rounded-lg px-4 py-3 outline-none"
                required
              />
              <div className="mb-4">
                <label htmlFor="trainer-status" className="block font-semibold mb-1">트레이너 상태</label>
                <select
                  id="trainer-status"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  value={trainerForm.trainerStatus || ''}
                  onChange={e => setTrainerForm(prev => ({ ...prev, trainerStatus: e.target.value }))}
                  required
                >
                  <option value="" disabled>상태 선택</option>
                  {trainerStatusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <label htmlFor="trainer-price" className="block font-bold mb-2">PT 가격</label>
              <input
                id="trainer-price"
                type="number"
                name="price"
                placeholder="PT 가격 (예: 18000)"
                value={trainerForm.price}
                onChange={e => setTrainerForm(prev => ({ ...prev, price: e.target.value }))}
                min={15000}
                className="w-full border-2 border-pink-200 focus:border-pink-500 rounded-lg px-4 py-3 outline-none"
                required
              />
              <label htmlFor="trainer-content" className="block font-bold mb-2">트레이너 소개/설명</label>
              <textarea
                id="trainer-content"
                name="content"
                placeholder="트레이너 소개/설명"
                value={trainerForm.content}
                onChange={e => setTrainerForm(prev => ({ ...prev, content: e.target.value }))}
                className="w-full border-2 border-pink-200 focus:border-pink-500 rounded-lg px-4 py-3 outline-none resize-none"
                rows={3}
                required
              />
              <div className="w-full">
                <label htmlFor="trainer-image" className="block font-bold mb-2">트레이너 사진 업로드 (여러 장 가능, 첫 번째가 대표)</label>
                <input
                  id="trainer-image"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={trainerMode === 'edit' ? handleTrainerImageUpdate : handleTrainerImageChange}
                  disabled={trainerMode === 'edit' && !selectedTrainer}
                  className="w-full"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {trainerImageUrls.map((url, idx) => (
                    <div key={idx} className="relative inline-block">
                      <img
                        src={url}
                        alt={url ? `미리보기${idx + 1}` : '이미지 없음'}
                        className={`w-20 h-20 object-cover rounded-lg border-2 ${idx === 0 ? 'border-blue-500' : 'border-gray-200'}`}
                        title={idx === 0 ? '대표사진' : undefined}
                        onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/80?text=No+Image'; }}
                      />
                      {trainerMode === 'edit' && (
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-500 hover:bg-red-100 border border-red-300"
                          onClick={() => handleTrainerImageDelete(url)}
                          style={{ transform: 'translate(40%,-40%)' }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-pink-600 hover:to-pink-400 transition-all"
          >
            {trainerMode === 'register' ? '트레이너 등록' : trainerMode === 'edit' ? '트레이너 수정' : '트레이너 삭제'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TrainerRegister; 