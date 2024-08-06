import React from 'react';
import Login from './components/login.jsx'; 
import ScrollToTop from './components/scrollToTop.jsx';

const LoginPage = () => {
  return (
    <div className='w-screen h-screen'>
        <ScrollToTop />
        <Login />
    </div>
  );
}

export default LoginPage;
