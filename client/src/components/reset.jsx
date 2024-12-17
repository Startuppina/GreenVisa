import { useState } from "react";
import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessagePopUp from "./messagePopUp";
import PassInfo from "./passInfo"; // Assuming PassInfo is used for password requirements info

export default function Reset() {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passInfo, setPassInfo] = useState(false);

  const [buttonPopup, setButtonPopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState("");

  const navigate = useNavigate();

  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handlePasswordConfirmChange = (e) => setPasswordConfirm(e.target.value);
  const handleTermsChange = (e) => setAcceptedTerms(e.target.checked);

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const togglePassInfo = () => setPassInfo(!passInfo);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setMessagePopup("Le password non corrispondono");
      setButtonPopup(true);
      return;
    }

    if (!acceptedTerms) {
      setMessagePopup("Devi accettare i termini e le condizioni");
      setButtonPopup(true);
      return;
    }

    const recoveryToken = localStorage.getItem("recoveryToken");

    try {
      const response = await axios.put(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/change-password`, {
        password
      }, {
        headers: {
          'Authorization': `Bearer ${recoveryToken}`
        }
      });

      if (response.status === 200) {
        navigate("/Recovered");
      }
    } catch (error) {
      console.log(error);
      setMessagePopup(error.response?.data?.msg || error.message);
      setButtonPopup(true);
    }
  };

  return (
    <>
      <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
        {messagePopup}
      </MessagePopUp>
      <div className="flex flex-col justify-center items-center w-screen h-screen bg-gray-50">
        <div className="text-center mb-6">
          <img
            src="img/logo.png"
            alt="logo"
            className="w-[200px] h-[200px] mx-auto"
          />
        </div>
        <div className="bg-white px-6 pt-10 pb-9 shadow-xl mx-auto w-full max-w-lg rounded-2xl text-arial">
          <div className="mx-auto flex w-full max-w-md flex-col space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="font-semibold text-3xl">
                <p>Cambia la tua password</p>
              </div>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-4">
                <div className='flex flex-col items-center justify-center mb-5 relative'>
                  <div className='w-[80%]'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-1'>
                        <label htmlFor="password" className='block text-xl'>Password</label>
                        <svg
                          className='cursor-pointer ml-2'
                          onClick={togglePassInfo}
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-black'>Mostra password</span>
                        <input
                          type="checkbox"
                          name="showPassword"
                          id="showPassword"
                          onClick={toggleShowPassword}
                          className='cursor-pointer'
                        />
                      </div>
                    </div>
                    <div className='relative'>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        value={password}
                        onChange={handlePasswordChange}
                        className='bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5'
                      />
                      {passInfo && (
                        <PassInfo onClose={() => setPassInfo(false)} />
                      )}
                    </div>
                  </div>
                </div>
                <div className='flex flex-col items-center justify-center mb-5'>
                  <div className='w-[80%]'>
                    <label htmlFor="confirm-password" className="block text-xl">Conferma Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirm-password"
                      id="confirm-password"
                      className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                      value={passwordConfirm}
                      onChange={handlePasswordConfirmChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center w-full">
                <div className="w-[80%] flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      aria-describedby="terms"
                      type="checkbox"
                      className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                      required
                      onChange={handleTermsChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-500">
                      Accetto i{" "}
                      <a
                        className="text-[#2d7044] hover:underline"
                        href="#"
                      >
                        Termini e Condizioni
                      </a>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="font-bold flex justify-center items-center w-[80%] lg:w-[60%] border rounded-xl py-4 bg-[#2d7044] text-white hover:bg-white hover:text-[#2d7044] hover:border-2 hover:border-[#2d7044] transition-colors duration-300 ease-in-out text-xl"
                >
                  Cambia Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
