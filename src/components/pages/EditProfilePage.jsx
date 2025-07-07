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
  const [isSocialUser, setIsSocialUser] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    // 최초 마운트에만 내 정보 조회
    api.get('/users/me')
      .then(res => {
        const user = res.data?.data;
        // 소셜 로그인 사용자인지 확인 (authProvider가 있으면 소셜 사용자)
        const socialUser = user?.authProvider && user.authProvider !== 'LOCAL';
        setIsSocialUser(socialUser);
        
        setForm(prev => ({
          ...prev,
          name: user?.name || '',
          phone: user?.phone || '',
          age: user?.age || '',
          address: user?.address || '',
          password: '',
          imageUrl: prev.imageUrl || user?.userImage || '',
        }));
      })
      .catch(() => setError('내 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // S3 presigned url 방식 이미지 업로드 (상태값만 갱신, 서버에 PATCH 안 보냄)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgUploading(true);
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
      // S3에 저장된 실제 이미지 URL 조합
      const s3Url = `https://fit-pass-1.s3.ap-northeast-2.amazonaws.com/${fileName}`;
      setForm(prev => {
        const next = { ...prev, imageUrl: s3Url };
        console.log('이미지 업로드 후 form 상태:', next);
        return next;
      });
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

  // 저장 버튼 (유저 정보 수정)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const patchData = {
      name: form.name,
      age: form.age,
      address: form.address,
      phone: form.phone,
      userImage: form.imageUrl ?? '',
    };
    if (form.password) patchData.password = form.password;
    console.log('PATCH 요청 직전 patchData:', patchData);
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
        {/* 비밀번호(선택 입력) - 소셜 로그인 사용자는 숨김 */}
        {!isSocialUser && (
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
        )}
        {/* 소셜 로그인 사용자 안내 메시지 */}
        {isSocialUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-semibold mb-1">소셜 로그인 사용자</p>
            <p>비밀번호는 소셜 계정에서 관리됩니다.</p>
          </div>
        )}
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