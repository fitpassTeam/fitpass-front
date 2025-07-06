import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import addressData from '../../assets/addressData';
import Select from 'react-select';
import { registerGym, getMyGyms, updateGym, deleteGym } from '../../api/gyms';
import { api } from '../../api/http';

// 임시: 실제로는 로그인 유저의 권한을 받아와야 함
const mockUser = {
  userRole: 'OWNER', // 'USER'면 접근 불가
};

// 주소 문자열을 시/도, 시/군/구, 상세주소로 분리하는 함수
function splitAddress(address) {
  if (!address) return { city: '', district: '', detailAddress: '' };
  const parts = address.split(' ');
  if (parts.length < 3) return { city: '', district: '', detailAddress: address };
  const city = parts[0];
  // district는 2~3번째까지 붙일 수 있음 (ex: 고양시 덕양구)
  let district = parts[1];
  if (parts[2].endsWith('구') || parts[2].endsWith('군') || parts[2].endsWith('시')) {
    district += ' ' + parts[2];
  }
  const detailAddress = parts.slice(district.split(' ').length + 1).join(' ');
  return { city, district, detailAddress };
}

function GymRegister() {
  const [form, setForm] = useState({
    name: '',
    number: '',
    content: '',
    city: '',
    district: '',
    detailAddress: '',
    openTime: '',
    closeTime: '',
    gymImage: [], // S3 URL 배열
    summary: '',
  });
  const [imgPreviews, setImgPreviews] = useState([]); // 미리보기용
  const [error, setError] = useState('');
  const [mode, setMode] = useState('register'); // 'register' | 'edit' | 'delete'
  const [myGyms, setMyGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [oldImages, setOldImages] = useState([]); // DB에 저장된 기존 이미지 S3 URL 배열
  const navigate = useNavigate();

  // 체육관 목록 불러오기 (수정/삭제 모두 내 체육관만)
  useEffect(() => {
    if (mode === 'edit' || mode === 'delete') {
      getMyGyms().then(res => {
        const gyms = Array.isArray(res.data.data) ? res.data.data : [];
        setMyGyms(gyms);
        // localStorage에 이전 선택값이 있으면 복원
        const prevGymId = localStorage.getItem('selectedGymId');
        if (prevGymId) {
          const found = gyms.find(g => String(g.id || g.gymId || g._id) === prevGymId);
          if (found) setSelectedGym({ value: found.id || found.gymId || found._id, label: `${found.name} (${found.city || ''} ${found.district || ''})`, ...found });
        }
      });
    }
  }, [mode]);

  // 체육관 선택 시 정보 자동입력
  useEffect(() => {
    if (mode !== 'register' && selectedGym) {
      const { city, district, detailAddress } = splitAddress(selectedGym.address);
      setForm({
        name: selectedGym.name || '',
        number: selectedGym.number || '',
        content: selectedGym.content || '',
        city: city || '',
        district: district || '',
        detailAddress: detailAddress || '',
        openTime: selectedGym.openTime || '',
        closeTime: selectedGym.closeTime || '',
        gymImage: selectedGym.gymImage || [],
        summary: selectedGym.summary || '',
      });
      setImgPreviews(selectedGym.gymImage || []);
      setOldImages(selectedGym.gymImage || []); // 기존 이미지 배열 저장
    } else if (mode === 'register') {
      setForm({
        name: '', number: '', content: '', city: '', district: '', detailAddress: '', openTime: '', closeTime: '', gymImage: [], summary: ''
      });
      setImgPreviews([]);
      setOldImages([]);
      setSelectedGym(null);
    }
  }, [mode, selectedGym]);

  // 권한 검사 (등록만 OWNER 제한, 수정/삭제/리스트는 모두 허용)
  if (mode === 'register' && mockUser.userRole !== 'OWNER') {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-red-500 text-xl font-bold">
        사업자(OWNER)만 체육관 등록이 가능합니다.
      </div>
    );
  }

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
        setForm(prev => ({ ...prev, gymImage: [...prev.gymImage, s3Url] }));
      } catch (err) {
        alert('이미지 업로드 중 오류 발생');
      }
    }
  };

  // 이미지 삭제 핸들러 (수정 모드: 기존/새 이미지 구분)
  const handleImageDelete = async (idx) => {
    const url = form.gymImage[idx];
    // 기존 이미지라면 서버에 삭제 요청
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
    // 프론트 상태에서 삭제(공통)
    setImgPreviews(prev => prev.filter((_, i) => i !== idx));
    setForm(prev => ({ ...prev, gymImage: prev.gymImage.filter((_, i) => i !== idx) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // react-select 옵션
  const cityOptions = Object.keys(addressData).map(city => ({ value: city, label: city }));
  const districtOptions = form.city ? addressData[form.city].map(d => ({ value: d, label: d })) : [];

  // 내 체육관 드롭다운 옵션
  const gymOptions = myGyms.map(gym => {
    const hasAddress = gym.city || gym.district;
    return {
      value: gym.id || gym.gymId || gym._id,
      label: hasAddress ? `${gym.name} (${gym.city || ''} ${gym.district || ''})` : gym.name,
      ...gym,
    };
  });

  // 드롭다운에서 선택 시 localStorage에 저장
  const handleGymSelect = (option) => {
    setSelectedGym(option);
    if (option) localStorage.setItem('selectedGymId', String(option.value));
    else localStorage.removeItem('selectedGymId');
  };

  // 수정/삭제 핸들러
  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym) {
      setError('수정할 체육관을 선택해 주세요.');
      return;
    }
    try {
      await updateGym(selectedGym.value, form);
      alert('체육관 정보가 수정되었습니다!');
      navigate('/mypage');
    } catch (err) {
      setError('체육관 수정에 실패했습니다.');
    }
  };
  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGym) {
      setError('삭제할 체육관을 선택해 주세요.');
      return;
    }
    if (!window.confirm('정말로 이 체육관을 삭제하시겠습니까?')) return;
    try {
      await deleteGym(selectedGym.value);
      alert('체육관이 삭제되었습니다!');
      navigate('/mypage');
    } catch (err) {
      setError('체육관 삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.number || !form.content || !form.city || !form.district || !form.detailAddress || !form.openTime || !form.closeTime || form.gymImage.length === 0 || !form.summary) {
      setError('모든 필수 항목을 입력해 주세요.');
      return;
    }
    try {
      await registerGym(form);
      alert('체육관 등록이 완료되었습니다!');
      navigate('/mypage');
    } catch (err) {
      setError('체육관 등록에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-center">체육관 관리</h1>
      <div className="flex gap-4 justify-center mb-8">
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow transition border-2 ${mode === 'register' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => setMode('register')}
        >
          체육관 등록
        </button>
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow transition border-2 ${mode === 'edit' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-500 border-purple-200 hover:bg-purple-50'}`}
          onClick={() => setMode('edit')}
        >
          체육관 수정
        </button>
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow transition border-2 ${mode === 'delete' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-500 border-red-200 hover:bg-red-50'}`}
          onClick={() => setMode('delete')}
        >
          체육관 삭제
        </button>
      </div>
      {mode === 'delete' || mode === 'edit' ? (
        <>
          <div className="mb-4 w-full">
            <label htmlFor="my-gym-select" className="block font-semibold mb-1">내 체육관 선택</label>
            <Select
              inputId="my-gym-select"
              options={gymOptions}
              value={gymOptions.find(opt => opt.value === selectedGym?.value) || null}
              onChange={handleGymSelect}
              placeholder="내 체육관 선택"
              isClearable
              menuPlacement="auto"
            />
          </div>
          {mode === 'delete' ? (
            <>
              {error && <div className="text-red-500 font-bold text-center">{error}</div>}
              <button
                type="button"
                className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition"
                onClick={handleDelete}
                disabled={!selectedGym}
              >
                체육관 삭제
              </button>
            </>
          ) : (
            <form onSubmit={handleEdit} className="space-y-5 w-full">
              <input
                type="text"
                name="name"
                placeholder="체육관 이름"
                value={form.name}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              />
              <input
                type="tel"
                name="number"
                placeholder="전화번호 (예: 010-1234-5678)"
                value={form.number}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                required
              />
              <textarea
                name="content"
                placeholder="체육관 설명"
                value={form.content}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none resize-none"
                maxLength={1000}
                rows={5}
                required
              />
              <div className="text-right text-xs text-gray-400 mt-1">{form.content.length}/1000자</div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <Select
                    options={cityOptions}
                    value={cityOptions.find(opt => opt.value === form.city) || null}
                    onChange={option => setForm(prev => ({ ...prev, city: option ? option.value : '', district: '' }))}
                    placeholder="시/도 선택"
                    isClearable
                    menuPlacement="auto"
                  />
                </div>
                <div className="w-1/2">
                  <Select
                    options={districtOptions}
                    value={districtOptions.find(opt => opt.value === form.district) || null}
                    onChange={option => setForm(prev => ({ ...prev, district: option ? option.value : '' }))}
                    placeholder="시/군/구 선택"
                    isDisabled={!form.city}
                    isClearable
                    menuPlacement="auto"
                  />
                </div>
              </div>
              <input
                type="text"
                name="detailAddress"
                placeholder="상세주소"
                value={form.detailAddress}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none"
                required
              />
              <div className="flex gap-4">
                <input
                  type="time"
                  name="openTime"
                  value={form.openTime}
                  onChange={handleChange}
                  className="w-1/2 border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                  required
                />
                <input
                  type="time"
                  name="closeTime"
                  value={form.closeTime}
                  onChange={handleChange}
                  className="w-1/2 border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                  required
                />
              </div>
              <textarea
                name="summary"
                placeholder="상태메시지/한줄소개 (예: 맛있는 체육관)"
                value={form.summary || ''}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none resize-none"
                maxLength={300}
                rows={3}
                required
              />
              <div className="text-right text-xs text-gray-400 mt-1">{form.summary.length}/300자</div>
              <div>
                <label className="block font-bold mb-2">사진 업로드 (여러 장 가능, 첫 번째가 대표)</label>
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
              <button type="submit" className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition">체육관 수정</button>
            </form>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 w-full">
          <input
            type="text"
            name="name"
            placeholder="체육관 이름"
            value={form.name}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
            required
          />
          <input
            type="tel"
            name="number"
            placeholder="전화번호 (예: 010-1234-5678)"
            value={form.number}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
            required
          />
          <textarea
            name="content"
            placeholder="체육관 설명"
            value={form.content}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none resize-none"
            maxLength={1000}
            rows={5}
            required
          />
          <div className="text-right text-xs text-gray-400 mt-1">{form.content.length}/1000자</div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <Select
                options={cityOptions}
                value={cityOptions.find(opt => opt.value === form.city) || null}
                onChange={option => setForm(prev => ({ ...prev, city: option ? option.value : '', district: '' }))}
                placeholder="시/도 선택"
                isClearable
                menuPlacement="auto"
              />
            </div>
            <div className="w-1/2">
              <Select
                options={districtOptions}
                value={districtOptions.find(opt => opt.value === form.district) || null}
                onChange={option => setForm(prev => ({ ...prev, district: option ? option.value : '' }))}
                placeholder="시/군/구 선택"
                isDisabled={!form.city}
                isClearable
                menuPlacement="auto"
              />
            </div>
          </div>
          <input
            type="text"
            name="detailAddress"
            placeholder="상세주소"
            value={form.detailAddress}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none"
            required
          />
          <div className="flex gap-4">
            <input
              type="time"
              name="openTime"
              value={form.openTime}
              onChange={handleChange}
              className="w-1/2 border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
              required
            />
            <input
              type="time"
              name="closeTime"
              value={form.closeTime}
              onChange={handleChange}
              className="w-1/2 border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
              required
            />
          </div>
          <textarea
            name="summary"
            placeholder="상태메시지/한줄소개 (예: 맛있는 체육관)"
            value={form.summary || ''}
            onChange={handleChange}
            className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none resize-none"
            maxLength={300}
            rows={3}
            required
          />
          <div className="text-right text-xs text-gray-400 mt-1">{form.summary.length}/300자</div>
          <div>
            <label className="block font-bold mb-2">사진 업로드 (여러 장 가능, 첫 번째가 대표)</label>
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
          <button type="submit" className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition">체육관 등록</button>
        </form>
      )}
    </div>
  );
}

export default GymRegister; 