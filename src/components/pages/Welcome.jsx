import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import gymImg from '../../assets/헬스장.png';

function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-blue-100 via-pink-100 to-purple-100 animate-fadeIn">
      <img src={logo} alt="FitPass 로고" className="w-24 h-24 mb-4 rounded-full shadow-lg border-4 border-white" />
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-pink-400 to-purple-500 mb-4 drop-shadow-lg text-center">
        FITPASS에 오신 걸 환영합니다!
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 mb-8 text-center max-w-xl">
        전국의 다양한 헬스장 정보를 한눈에!<br/>
        <span className="font-semibold text-blue-500">운동 목표</span>를 세우고, <span className="font-semibold text-pink-500">좋아요</span>로 관심 체육관을 저장하세요.<br/>
        <span className="font-semibold text-orange-500">실시간으로 헬스장과 소통 및 다양한 트레이너의 정보를 한 눈에!</span><br/>
        지금 바로 시작해보세요.
      </p>
      <img src={gymImg} alt="헬스장 일러스트" className="w-64 h-48 object-cover rounded-xl shadow mb-8 border-2 border-blue-200" />
      <button
        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold rounded-full shadow-lg hover:scale-105 hover:from-pink-500 hover:to-blue-500 transition-all duration-200"
        onClick={() => navigate('/home')}
      >
        알아보기 시작하기
      </button>
    </div>
  );
}

export default Welcome; 