import { useEffect, useState } from 'react';
import Select from 'react-select';
import { getMyGyms } from '../../api/gyms';
import { api } from '../../api/http';

function TrainerRegister() {
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', content: '', imageUrl: '' });
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [mode, setMode] = useState('register'); // 'register' | 'edit'
  const [error, setError] = useState('');

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

  // 트레이너 선택 시 폼 자동입력
  useEffect(() => {
    if (mode === 'edit' && selectedTrainer) {
      setForm({
        name: selectedTrainer.name || '',
        price: selectedTrainer.price || '',
        content: selectedTrainer.content || '',
        imageUrl: selectedTrainer.imageUrl || '',
      });
    } else if (mode === 'register') {
      setForm({ name: '', price: '', content: '', imageUrl: '' });
      setSelectedTrainer(null);
    }
  }, [mode, selectedTrainer]);

  // 등록
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym) return setError('체육관을 선택해 주세요.');
    if (!form.name || !form.price || !form.content) return setError('모든 항목을 입력해 주세요.');
    try {
      await api.post(`/gyms/${selectedGym.value}/trainers`, form);
      alert('트레이너 등록 완료!');
      setForm({ name: '', price: '', content: '', imageUrl: '' });
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
      await api.patch(`/gyms/${selectedGym.value}/trainers/${selectedTrainer.id}`, form);
      alert('트레이너 정보 수정 완료!');
      setForm({ name: '', price: '', content: '', imageUrl: '' });
      setSelectedTrainer(null);
      setMode('register');
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
      <div className="mb-4 w-full">
        <label htmlFor="trainer-select" className="block font-semibold mb-1">트레이너 선택(수정/삭제)</label>
        <Select
          inputId="trainer-select"
          options={trainerOptions}
          value={trainerOptions.find(opt => opt.value === selectedTrainer?.id) || null}
          onChange={option => { setSelectedTrainer(option); setMode('edit'); }}
          placeholder="트레이너 선택"
          isClearable
          menuPlacement="auto"
        />
      </div>
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
          name="content"
          placeholder="소개/설명"
          value={form.content}
          onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
          className="w-full border-2 border-pink-200 focus:border-pink-500 rounded-lg px-4 py-3 transition-all outline-none resize-none"
          rows={3}
          required
        />
        {/* 이미지 업로드는 presigned url 방식이 아니면 제외 */}
        {error && <div className="text-red-500 font-bold text-center">{error}</div>}
        {mode === 'register' && <button type="submit" className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 transition">트레이너 등록</button>}
        {mode === 'edit' && <button type="submit" className="w-full bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 transition">트레이너 수정</button>}
        {mode === 'edit' && <button type="button" className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition mt-2" onClick={() => handleDelete(selectedTrainer.id)}>트레이너 삭제</button>}
      </form>
    </div>
  );
}

export default TrainerRegister;
