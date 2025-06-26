import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 임시: 실제로는 API에서 유저 정보를 받아와야 함
const mockUser = {
  email: 'user@example.com',
  name: '홍길동',
  phone: '010-1234-5678',
  age: 28,
  address: '서울시 강남구',
  gender: 'MAN',
};

function EditProfilePage() {
  const [form, setForm] = useState({
    name: mockUser.name,
    phone: mockUser.phone,
    age: mockUser.age,
    address: mockUser.address,
    gender: mockUser.gender,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // TODO: 실제로는 API로 정보 수정
    alert('내 정보가 수정되었습니다!');
    navigate('/mypage');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-xl flex flex-col gap-6 min-w-[340px] max-w-[400px] w-full">
        <h2 className="text-2xl font-bold text-center mb-2">내 정보 수정</h2>
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
        <div className="flex flex-col gap-2">
          <label className="font-bold">성별</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-2 outline-none"
            required
          >
            <option value="MAN">남성</option>
            <option value="WOMAN">여성</option>
            <option value="OTHER">기타</option>
          </select>
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-pink-500 hover:to-blue-500 transition-all"
        >
          저장
        </button>
      </form>
    </div>
  );
}

export default EditProfilePage; 