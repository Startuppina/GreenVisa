import React from 'react';
import Navbar from './components/navbar';
import Footer from './components/footer';

const NotFoundPage = () => {
    return (
        <div className='flex flex-col items-center justify-center'>
            <Navbar />
            <div className='flex flex-col items-center justify-center h-[50vh] text-center p-4 sm:p-8'>
                <img src="/img/404.png" alt="404" className='w-full sm:w-1/2 md:w-1/3 mb-8' />
                <h1 className='text-xl sm:text-2xl md:text-3xl font-bold mb-4'>Page Not Found</h1>
                <p className='text-lg sm:text-xl'>The page you are looking for does not exist.</p>
            </div>
            <div className='absolute bottom-0 w-full'>
                <Footer />
            </div>
        </div>
    );
};

export default NotFoundPage;
