import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/http';

function EditProfilePage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: '',
    address: '',
    password: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [imgUploading, setImgUploading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    // 내 정보 불러오기
    api.get('/users/me')
      .then(res => {
        const user = res.data?.data;
        setForm({
          name: user?.name || '',
          phone: user?.phone || '',
          age: user?.age || '',
          address: user?.address || '',
          password: '',
          imageUrl: user?.imageUrl || '',
        });
      })
      .catch(() => setError('내 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // S3 이미지 업로드
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const res = await api.patch('/users/me/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, imageUrl: res.data?.data }));
    } catch (err) {
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setImgUploading(false);
    }
  };

  // S3 이미지 삭제
  const handleImageDelete = async () => {
    if (!form.imageUrl) return;
    setImgUploading(true);
    try {
      await api.patch('/users/me/profile-image', null, {
        headers: { 'Content-Type': 'application/json' },
      });
      setForm(prev => ({ ...prev, imageUrl: '' }));
    } catch (err) {
      setError('이미지 삭제에 실패했습니다.');
    } finally {
      setImgUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const patchData = {
      name: form.name,
      phone: form.phone,
      age: form.age,
      address: form.address,
    };
    if (form.password) patchData.password = form.password;
    if (form.imageUrl) patchData.userImage = form.imageUrl;
    try {
      await api.patch('/users/me', patchData);
      alert('내 정보가 수정되었습니다!');
      navigate('/mypage');
    } catch (err) {
      setError('정보 수정에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh] text-blue-400 animate-pulse text-xl font-bold">내 정보 불러오는 중...</div>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-xl flex flex-col gap-6 min-w-[340px] max-w-[400px] w-full">
        <h2 className="text-2xl font-bold text-center mb-2">내 정보 수정</h2>
        {/* 프로필 이미지 */}
        <div className="flex flex-col gap-2 items-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-2">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="프로필" className="object-cover w-full h-full" />
            ) : (
              <span className="text-gray-400">이미지 없음</span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded shadow text-sm font-bold" onClick={() => fileInputRef.current.click()} disabled={imgUploading}>이미지 업로드</button>
            {form.imageUrl && <button type="button" className="px-3 py-1 bg-red-400 text-white rounded shadow text-sm font-bold" onClick={handleImageDelete} disabled={imgUploading}>삭제</button>}
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} disabled={imgUploading} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">이름</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-2 outline-none"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">전화번호</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-2 outline-none"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">나이</label>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-2 outline-none"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">주소</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-2 outline-none"
            required
          />
        </div>
        {/* 비밀번호(선택 입력) */}
        <div className="flex flex-col gap-2">
          <label className="font-bold">새 비밀번호 (선택)</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-2 outline-none"
            placeholder="변경 시에만 입력"
            autoComplete="new-password"
          />
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-pink-500 hover:to-blue-500 transition-all"
          disabled={imgUploading}
        >
          저장
        </button>
      </form>
    </div>
  );
}

export default EditProfilePage; 