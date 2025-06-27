import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signupUser } from '../../api/signup';
import logo from '../../assets/logo.jpg';
import addressData from '../../assets/addressData';
import Select from 'react-select';

function Signup() {
    const [form, setForm] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        age: '',
        city: '',
        district: '',
        detailAddress: '',
        gender: '',
    });
    const [errors, setErrors] = useState({});
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const validate = () => {
        const newErrors = {};
        // 비밀번호: 최소 8자, 대문자, 소문자, 숫자, 특수문자
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(form.password)) {
            newErrors.password = '비밀번호는 최소 8자, 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.';
        }
        // 전화번호: 010-1111-1111 형식
        if (!/^010-\d{4}-\d{4}$/.test(form.phone)) {
            newErrors.phone = '전화번호는 010-1234-5678 형식으로 입력해 주세요.';
        }
        // 나이: 0 이상
        if (form.age === '' || isNaN(form.age) || Number(form.age) < 0) {
            newErrors.age = '나이는 0살 이상이어야 합니다.';
        }
        if (!form.city) {
            newErrors.city = '시/도를 선택해 주세요.';
        }
        if (!form.district) {
            newErrors.district = '시/군/구를 선택해 주세요.';
        }
        if (!form.detailAddress) {
            newErrors.detailAddress = '상세주소를 입력해 주세요.';
        }
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // react-select용 옵션 변환
    const cityOptions = Object.keys(addressData).map(city => ({ value: city, label: city }));
    const districtOptions = form.city ? addressData[form.city].map(d => ({ value: d, label: d })) : [];

    // React Query mutation
    const mutation = useMutation({
        mutationFn: (formData) => {
            const { city, district, detailAddress, ...rest } = formData;
            return signupUser({
                ...rest,
                age: parseInt(formData.age),
                address: `${city} ${district} ${detailAddress}`.trim()
            });
        },
        onSuccess: () => {
            setShowModal(true);
        },
        onError: (error) => {
            alert('회원가입 실패: ' + (error.response?.data?.message || error.message));
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length === 0) {
            mutation.mutate(form);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        navigate('/');
    };

    return (
        <div className="max-w-md mx-auto bg-white/90 p-10 rounded-2xl shadow-2xl mt-12 flex flex-col items-center">
            <img src={logo} alt="logo" className="w-16 h-16 mb-4 rounded-full shadow" />
            <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text drop-shadow">
                회원가입
            </h1>
            <form onSubmit={handleSubmit} className="space-y-5 w-full">
                <input
                    type="email"
                    name="email"
                    placeholder="이메일"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="비밀번호"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                    required
                />
                {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
                <input
                    type="text"
                    name="name"
                    placeholder="이름"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                    required
                />
                <input
                    type="tel"
                    name="phone"
                    placeholder="010-1234-5678"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                    required
                />
                {errors.phone && <div className="text-red-500 text-sm">{errors.phone}</div>}
                <input
                    type="number"
                    name="age"
                    placeholder="나이"
                    value={form.age}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all outline-none"
                    min="0"
                    required
                />
                {errors.age && <div className="text-red-500 text-sm">{errors.age}</div>}
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <Select
                      options={cityOptions}
                      value={cityOptions.find(opt => opt.value === form.city) || null}
                      onChange={option => setForm(prev => ({ ...prev, city: option.value, district: '' }))}
                      placeholder="시/도 선택"
                      isClearable
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
                    />
                  </div>
                </div>
                {errors.city && <div className="text-red-500 text-sm">{errors.city}</div>}
                {errors.district && <div className="text-red-500 text-sm">{errors.district}</div>}
                <input
                  type="text"
                  name="detailAddress"
                  placeholder="상세주소"
                  value={form.detailAddress}
                  onChange={handleChange}
                  className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none"
                  required
                />
                {errors.detailAddress && <div className="text-red-500 text-sm">{errors.detailAddress}</div>}
                <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none"
                    required
                >
                    <option value="">성별 선택</option>
                    <option value="MAN">남성</option>
                    <option value="WOMAN">여성</option>
                </select>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-pink-500 hover:to-blue-500 transition-all"
                    disabled={mutation.isLoading}
                >
                    {mutation.isLoading ? '회원가입 중...' : '회원가입'}
                </button>
            </form>
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white p-8 rounded-2xl shadow text-center">
                        <h2 className="text-2xl font-bold mb-4 text-blue-600">회원가입이 완료되었습니다!</h2>
                        <button
                            onClick={handleModalClose}
                            className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow hover:from-pink-500 hover:to-blue-500 transition-all"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Signup;