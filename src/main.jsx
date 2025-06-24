import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App';
// import ErrorPage from './pages/ErrorPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './components/pages/Home';
import Login from './components/pages/Login';
import Signup from './components/pages/Signup';
import SocialLogin from './components/pages/SocialLogin';
import Welcome from './components/pages/Welcome';
import MyPage from './components/pages/MyPage';
import GymRegister from './components/pages/GymRegister';
import PasswordCheckPage from './components/pages/PasswordCheckPage';
import EditProfilePage from './components/pages/EditProfilePage';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <Welcome />,
      },
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <Signup />,
      },
      {
        path: 'sociallogin',
        element: <SocialLogin />,
      },
      {
        path: 'mypage',
        element: <MyPage />,
      },
      {
        path: 'gymregister',
        element: <GymRegister />,
      },
      {
        path: 'check-password',
        element: <PasswordCheckPage />,
      },
      {
        path: 'edit-profile',
        element: <EditProfilePage />,
      },
      // {
      //   path: '/fitness-goals/{fitnessGoalId}/daily-records',
      //   element: <GoalDetail />,
      // },
            // {
      //   path: '/me',
      //   element: <MyPage />,
      // },
    ],
    // errorElement: <ErrorPage />,
  },
]);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
