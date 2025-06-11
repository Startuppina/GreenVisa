import React from "react";
import { useNavigate } from 'react-router-dom';

export default function Recovered() {
  const navigate = useNavigate();

  const returnToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="text-arial">
      <div className="w-full min-h-screen flex flex-col items-center justify-center">
        <img src="/img/logo.png" alt="logo" className="w-[150px] h-[150px] md:w-[200px] md:h-[200px]" />
        <div className="flex items-center justify-center pt-8">
          <h1 className="w-[70%] font-arial font-bold text-4xl text-center">
            Password modificata con successo!
          </h1>
        </div>
        <div className="w-full flex items-center justify-center p-8">
          <button
            className="font-bold w-[60%] md:w-[40%] flex justify-center items-center border-2 border-transparent rounded-xl py-4 bg-[#2d7044] text-white hover:bg-white hover:text-[#2d7044] hover:border-[#2d7044] transition-colors duration-300 ease-in-out text-xl"
            onClick={returnToLogin}
          >
            Torna a login
          </button>
        </div>
      </div>
    </div>
  );
}
