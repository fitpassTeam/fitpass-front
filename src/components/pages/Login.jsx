import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../../api/login';
import { socialLogin } from '../../api-config';
import logo from '../../assets/logo.jpg';

function Login() {
    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            const tokens = data?.data?.data;
            if (tokens && tokens.accessToken) {
                const accessToken = tokens.accessToken.replace(/^Bearer\s/, '');
                localStorage.setItem('token', accessToken);
                if (tokens.refreshToken) {
                    const refreshToken = tokens.refreshToken.replace(/^Bearer\s/, '');
                    localStorage.setItem('refreshToken', refreshToken);
                }
                alert('로그인 성공!');
                window.location.href = '/home';
            } else {
                alert('로그인 응답에 accessToken이 없습니다.');
            }
        },
        onError: () => {
            alert('로그인에 실패하였습니다.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    return (
        <div className="max-w-md mx-auto bg-white/90 p-10 rounded-2xl shadow-2xl mt-12 flex flex-col items-center">
            <img src={logo} alt="logo" className="w-16 h-16 mb-4 rounded-full shadow" />
            <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text drop-shadow">
                로그인
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
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-pink-500 hover:to-blue-500 transition-all"
                    disabled={mutation.isLoading}
                >
                    {mutation.isLoading ? '로그인 중...' : '로그인'}
                </button>
            </form>
            <button
                type="button"
                className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold text-lg shadow flex items-center justify-center gap-2 transition-all"
                onClick={() => socialLogin('naver')}
            >
                <span className="inline-flex items-center justify-center w-8 h-8 mr-2">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#03C75A"/>
                    <text x="16" y="20" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">N</text>
                  </svg>
                </span>
                네이버 로그인
            </button>
        </div>
    );
}

export default Login;