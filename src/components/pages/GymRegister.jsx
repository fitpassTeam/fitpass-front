import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 임시: 실제로는 로그인 유저의 권한을 받아와야 함
const mockUser = {
  userRole: 'OWNER', // 'USER'면 접근 불가
};

function GymRegister() {
  const [form, setForm] = useState({
    name: '',
    number: '',
    content: '',
    address: '',
    openTime: '',
    closeTime: '',
    gymImage: [],
  });
  const [imageUrls, setImageUrls] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 권한 검사
  if (mockUser.userRole !== 'OWNER') {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-red-500 text-xl font-bold">
        사업자(OWNER)만 체육관 등록이 가능합니다.
      </div>
    );
  }

  // 이미지 업로드 핸들러 (여러 장)
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);

    // 실제로는 각 파일을 사진 업로드 API에 보내고, url을 받아서 imageUrls에 저장해야 함
    // 여기선 예시로 파일명을 url로 사용
    // 실제로는 await uploadImageAPI(file) → url 받아서 setImageUrls([...])
    const urls = await Promise.all(
      files.map(async (file) => {
        // TODO: 실제 업로드 API 연동
        // const url = await uploadImageAPI(file);
        // return url;
        return URL.createObjectURL(file); // 임시: 미리보기용
      })
    );
    setImageUrls(urls);
    setForm((prev) => ({ ...prev, gymImage: urls }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // 유효성 검사
    if (!form.name || !form.number || !form.content || !form.address || !form.openTime || !form.closeTime || form.gymImage.length === 0) {
      setError('모든 필수 항목을 입력해 주세요.');
      return;
    }
    // TODO: 실제 등록 API 호출
    // await registerGym(form);
    alert('체육관 등록이 완료되었습니다!');
    navigate('/mypage');
  };

  return (
    <div className="max-w-xl mx-auto bg-white/90 p-10 rounded-2xl shadow-2xl mt-12 flex flex-col items-center">
      <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text drop-shadow">
        체육관 등록
      </h1>
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
          className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none resize-none"
          rows={3}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="주소"
          value={form.address}
          onChange={handleChange}
          className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
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
            {imageUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`미리보기${idx + 1}`}
                className={`w-20 h-20 object-cover rounded-lg border-2 ${idx === 0 ? 'border-blue-500' : 'border-gray-200'}`}
                title={idx === 0 ? '대표사진' : undefined}
              />
            ))}
          </div>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-pink-500 hover:to-blue-500 transition-all"
        >
          체육관 등록
        </button>
      </form>
    </div>
  );
}

export default GymRegister; 