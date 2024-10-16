import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MessagePopUp from './messagePopUp';
import { useRecoveryContext } from '../provider/provider';

const InsertEmail = () => {
  const { OTP, setOTP } = useRecoveryContext();
  const [email, setEmail] = useState('');
  const [buttonPopup, setButtonPopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (e) => setEmail(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/send_email`, { email });

      console.log(response.data);

      if (response.data.exist === false) {
        setMessagePopup("L'email inserita non esiste");
        setButtonPopup(true);
        return;
      }

      if (response.status === 200) {
        const recoveryToken = response.data.token;
        localStorage.setItem('recoveryToken', recoveryToken);

        console.log(recoveryToken);

        if (recoveryToken) {
          const OTP = Math.floor(Math.random() * 9000 + 1000);
          console.log(OTP);
          setOTP(OTP);

          try {
            const response2 = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/send_recovery_email`, { email, OTP }, {
              headers: {
                'Authorization': `Bearer ${recoveryToken}`
              }
            });

            console.log(response2.data);

            if (response2.status === 200) {
              navigate('/Verification');
            } else {
              setMessagePopup(response2.data.msg);
              setButtonPopup(true);
            }
          } catch (error) {
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
          }
        }
      }
    } catch (error) {
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
                <p>Inserisci la tua email</p>
              </div>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xl"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                    onChange={handleEmailChange}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="font-bold flex justify-center items-center w-full border rounded-xl py-4 bg-[#2d7044] text-white hover:bg-white hover:text-[#2d7044] hover:border-2 hover:border-[#2d7044] transition-colors duration-300 ease-in-out text-xl"
              >
                Invia Email
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default InsertEmail;
