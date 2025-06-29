import { useEffect, useState } from 'react';
import Select from 'react-select';
import { getMyGyms } from '../../api/gyms';
import { API_BASE_URL } from '../../api-config';

function MembershipManagement() {
  const [mode, setMode] = useState('register'); // 'register' | 'edit' | 'delete' | 'reservation'
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', content: '', durationInDays: '' });
  const [error, setError] = useState('');
  // 예약 관리 관련 상태
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationError, setReservationError] = useState('');

  // 내 체육관 목록 불러오기
  useEffect(() => {
    getMyGyms().then(res => {
      setGyms(Array.isArray(res.data.data) ? res.data.data : []);
    });
  }, []);

  // 체육관 선택 시 해당 체육관의 이용권 목록 불러오기 (수정/삭제)
  useEffect(() => {
    if ((mode === 'edit' || mode === 'delete') && selectedGym) {
      const token = localStorage.getItem('token');
      fetch(`${API_BASE_URL}/gyms/${selectedGym.value}/memberships`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          setMemberships(Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.content) ? data.data.content : []));
        });
    } else {
      setMemberships([]);
      setSelectedMembership(null);
    }
  }, [mode, selectedGym]);

  // 이용권 선택 시 폼 자동입력 (수정)
  useEffect(() => {
    if (mode === 'edit' && selectedMembership) {
      setForm({
        name: selectedMembership.name || '',
        price: selectedMembership.price || '',
        content: selectedMembership.content || '',
        durationInDays: selectedMembership.durationInDays || '',
      });
    } else if (mode === 'register') {
      setForm({ name: '', price: '', content: '', durationInDays: '' });
      setSelectedMembership(null);
    }
  }, [mode, selectedMembership]);

  // 예약 관리: 체육관 선택 시 해당 체육관의 트레이너 예약 목록 불러오기
  useEffect(() => {
    if (mode === 'reservation' && selectedGym) {
      setLoadingReservations(true);
      setReservationError('');
      fetch(`${API_BASE_URL}/gyms/${selectedGym.value}/trainer-reservations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })
        .then(res => res.json())
        .then(data => {
          setReservations(Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.content) ? data.data.content : []));
        })
        .catch(() => setReservationError('예약 목록을 불러오지 못했습니다.'))
        .finally(() => setLoadingReservations(false));
    } else if (mode === 'reservation') {
      setReservations([]);
    }
  }, [mode, selectedGym]);

  // 등록
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym) {
      setError('체육관을 선택해 주세요.');
      return;
    }
    if (!form.name || !form.price || !form.content || !form.durationInDays) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/gyms/${selectedGym.value}/memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          content: form.content,
          durationInDays: Number(form.durationInDays),
        }),
      });
      const data = await res.json();
      if (data.statusCode === 201) {
        alert('이용권 등록이 완료되었습니다!');
        setForm({ name: '', price: '', content: '', durationInDays: '' });
      } else {
        setError('이용권 등록에 실패했습니다.');
      }
    } catch {
      setError('이용권 등록 중 오류 발생');
    }
  };

  // 수정
  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym || !selectedMembership) {
      setError('수정할 이용권을 선택해 주세요.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/gyms/${selectedGym.value}/memberships/${selectedMembership.id}`;
      const body = {
        name: form.name,
        price: Number(form.price),
        content: form.content,
        durationInDays: Number(form.durationInDays),
      };
      console.log('PATCH URL:', url);
      console.log('PATCH body:', body);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log('PATCH 응답:', data);
      if (data.statusCode === 200 || data.statusCode === 201) {
        alert('이용권 정보가 수정되었습니다!');
        setForm({ name: '', price: '', content: '', durationInDays: '' });
        setSelectedMembership(null);
        // memberships 목록 새로고침
        if (selectedGym) {
          fetch(`${API_BASE_URL}/gyms/${selectedGym.value}/memberships`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => {
              setMemberships(Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.content) ? data.data.content : []));
            });
        }
      } else {
        setError('이용권 수정에 실패했습니다.');
      }
    } catch {
      setError('이용권 수정 중 오류 발생');
    }
  };

  // 삭제
  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym || !selectedMembership) {
      setError('삭제할 이용권을 선택해 주세요.');
      return;
    }
    if (!window.confirm('정말로 이 이용권을 삭제하시겠습니까?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/gyms/${selectedGym.value}/memberships/${selectedMembership.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        alert('이용권이 삭제되었습니다!');
        setSelectedMembership(null);
        setForm({ name: '', price: '', content: '', durationInDays: '' });
        // memberships 목록 새로고침
        if (selectedGym) {
          fetch(`${API_BASE_URL}/gyms/${selectedGym.value}/memberships`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => {
              setMemberships(Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.content) ? data.data.content : []));
            });
        }
      } else {
        setError('이용권 삭제에 실패했습니다.');
      }
    } catch {
      setError('이용권 삭제 중 오류 발생');
    }
  };

  // 예약 승인/거절 핸들러
  const handleReservationAction = async (reservationId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status } : r));
      } else {
        alert('처리 실패!');
      }
    } catch {
      alert('네트워크 오류!');
    }
  };

  // 드롭다운 옵션
  const gymOptions = gyms.map(gym => ({ value: gym.id || gym.gymId || gym._id, label: gym.name, ...gym }));
  const membershipOptions = memberships.map(m => ({ value: m.id, label: m.name, ...m }));

  return (
    <div className="max-w-xl mx-auto bg-white/90 p-10 rounded-2xl shadow-2xl mt-12 flex flex-col items-center">
      <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text drop-shadow">
        이용권 관리
      </h1>
      <div className="flex gap-2 mb-6">
        <button type="button" className={`px-4 py-2 rounded font-bold ${mode === 'register' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setMode('register')}>등록</button>
        <button type="button" className={`px-4 py-2 rounded font-bold ${mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setMode('edit')}>수정</button>
        <button type="button" className={`px-4 py-2 rounded font-bold ${mode === 'delete' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setMode('delete')}>삭제</button>
      </div>
      {mode === 'reservation' ? (
        <div className="w-full">
          <label htmlFor="gym-select-reservation" className="block font-semibold mb-1">내 체육관 선택</label>
          <Select
            inputId="gym-select-reservation"
            options={gymOptions}
            value={gymOptions.find(opt => opt.value === selectedGym?.value) || null}
            onChange={option => setSelectedGym(option)}
            placeholder="내 체육관 선택"
            isClearable
            menuPlacement="auto"
          />
          {loadingReservations ? (
            <div className="text-blue-400 animate-pulse mt-4">예약 목록 불러오는 중...</div>
          ) : reservationError ? (
            <div className="text-red-500 mt-4">{reservationError}</div>
          ) : (
            <div className="mt-4 space-y-4">
              {reservations.length === 0 ? (
                <div className="text-gray-400">예약 내역이 없습니다.</div>
              ) : (
                reservations.map(r => (
                  <div key={r.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-gray-100">
                    <div className="font-bold text-lg">{r.trainerName} 트레이너</div>
                    <div className="text-gray-600">예약자: {r.userName} ({r.userEmail})</div>
                    <div className="text-gray-600">날짜: {r.reservationDate} / 시간: {r.reservationTime}</div>
                    <div className="text-gray-600">상태: <span className="font-bold">{r.status}</span></div>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-2 mt-2">
                        <button className="px-4 py-2 bg-green-500 text-white rounded font-bold" onClick={() => handleReservationAction(r.id, 'APPROVED')}>승인</button>
                        <button className="px-4 py-2 bg-red-500 text-white rounded font-bold" onClick={() => handleReservationAction(r.id, 'REJECTED')}>거절</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <>
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
          {mode !== 'register' && (
            <div className="mb-4 w-full">
              <label htmlFor="membership-select" className="block font-semibold mb-1">이용권 선택</label>
              <Select
                inputId="membership-select"
                options={membershipOptions}
                value={membershipOptions.find(opt => opt.value === selectedMembership?.value) || null}
                onChange={option => setSelectedMembership(option)}
                placeholder="이용권 선택"
                isClearable
                menuPlacement="auto"
              />
            </div>
          )}
          <form onSubmit={mode === 'register' ? handleRegister : mode === 'edit' ? handleEdit : handleDelete} className="space-y-5 w-full">
            {mode !== 'delete' && (
              <>
                <input
                  type="text"
                  name="name"
                  placeholder="이용권 이름"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                  required
                />
                <input
                  type="number"
                  name="price"
                  placeholder="가격"
                  value={form.price}
                  onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                  required
                />
                <textarea
                  name="content"
                  placeholder="이용권 설명"
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none resize-none"
                  rows={3}
                  required
                />
                <input
                  type="number"
                  name="durationInDays"
                  placeholder="기간(일)"
                  value={form.durationInDays}
                  onChange={e => setForm(prev => ({ ...prev, durationInDays: e.target.value }))}
                  className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                  required
                />
              </>
            )}
            {error && <div className="text-red-500 font-bold text-center">{error}</div>}
            {mode === 'register' && <button type="submit" className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition">이용권 등록</button>}
            {mode === 'edit' && <button type="submit" className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition">이용권 수정</button>}
            {mode === 'delete' && <button type="submit" className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition">이용권 삭제</button>}
          </form>
        </>
      )}
    </div>
  );
}

export default MembershipManagement; 