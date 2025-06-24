import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../../api/login';
import { socialLogin } from '../../api-config';

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
            console.log('로그인 응답:', data);
            const tokens = data?.data?.data;
            if (tokens && tokens.accessToken) {
                const accessToken = tokens.accessToken.replace(/^Bearer\s/, '');
                localStorage.setItem('token', accessToken);
                if (tokens.refreshToken) {
                    const refreshToken = tokens.refreshToken.replace(/^Bearer\s/, '');
                    localStorage.setItem('refreshToken', refreshToken);
                }
                alert('로그인 성공!');
                window.location.href = '/';
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
        <div className="max-w-md mx-auto bg-white p-8 rounded shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">로그인</h1>
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
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    disabled={mutation.isLoading}
                >
                    {mutation.isLoading ? '로그인 중...' : '로그인'}
                </button>
            </form>
            <button
                type="button"
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-bold text-lg"
                onClick={() => socialLogin('naver')}
            >
                네이버 로그인
            </button>
        </div>
    );
}

export default Login;