import React from 'react';
import Signup from './components/signup.jsx'; 
import ScrollToTop from './components/scrollToTop.jsx';

const SignUpPage = () => {
  return (
    <div className='w-screen h-screen'>
        <ScrollToTop />
        <Signup />
    </div>
  );
}

export default SignUpPage;
