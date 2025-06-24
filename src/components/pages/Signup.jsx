import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signupUser } from '../../api/signup';

function Signup() {
    const [form, setForm] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        age: '',
        address: '',
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
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // React Query mutation
    const mutation = useMutation({
        mutationFn: (formData) => signupUser({ ...formData, userRole: 'USER' }),
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
        <div className="max-w-md mx-auto bg-white p-8 rounded shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    name="email"
                    placeholder="이메일"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="비밀번호"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
                <input
                    type="text"
                    name="name"
                    placeholder="이름"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                <input
                    type="tel"
                    name="phone"
                    placeholder="010-1234-5678"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                {errors.phone && <div className="text-red-500 text-sm">{errors.phone}</div>}
                <input
                    type="number"
                    name="age"
                    placeholder="나이"
                    value={form.age}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                    required
                />
                {errors.age && <div className="text-red-500 text-sm">{errors.age}</div>}
                <input
                    type="text"
                    name="address"
                    placeholder="주소"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                >
                    <option value="">성별 선택</option>
                    <option value="MAN">남성</option>
                    <option value="WOMAN">여성</option>
                    <option value="NONE">기타</option>
                </select>
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    disabled={mutation.isLoading}
                >
                    {mutation.isLoading ? '회원가입 중...' : '회원가입'}
                </button>
            </form>
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                    <div className="bg-white p-8 rounded shadow text-center">
                        <h2 className="text-xl font-bold mb-4">회원가입이 완료되었습니다!</h2>
                        <button
                            onClick={handleModalClose}
                            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
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