import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from 'axios';
import MessagePopUp from './messagePopUp';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate(); // Usa useNavigate per la navigazione programmatica

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');


    const handleUsernameChange = (e) => setUsername(e.target.value);
    const handlePhoneChange = (value) => setPhone(value); // `value` già in formato internazionale
    const handleEmailChange = (e) => setEmail(e.target.value);
    const handlePasswordChange = (e) => setPassword(e.target.value);
    const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessagePopup('Le password non corrispondono');
            setButtonPopup(true);
            return;
        }

        setPhone(`+${phone}`);

        const formData = { username, email, password, phone };

        try {
            const response = await axios.post('http://localhost:8080/api/signup', formData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                navigate('/login');
            } 

        } catch (error) {
            //alert(error.response?.data?.msg || error.message);
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    return (
        <div className="bg-[url('/img/login.jpg')] bg-cover bg-center bg-no-repeat m-0 py-10 flex items-center justify-center">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className='w-full md:w-[60%] lg:w-[60%] h-auto flex flex-col items-center justify-center bg-white pb-10 rounded-lg'>
                <div className='relative top-2 left-3 text-arial w-full text-left text-[#2d7044] font-bold text-xl cursor-pointer'>
                    <Link to="/">Home</Link>
                </div>
                <div className='flex flex-col items-center justify-center mb-10 mt-5'>
                    <img src="/img/logo.png" alt="logo" className='w-[30%] mb-5 p-0' />
                </div>
                <form onSubmit={handleSubmit} className='w-full'>
                    <div className='flex flex-col items-center justify-center mb-5'>
                        <div className='w-[70%] lg:w-[60%]'>
                            <label htmlFor="username" className='font-arial text-xl font-bold text-start block mb-2'>Username</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                value={username}
                                onChange={handleUsernameChange}
                                className='w-full p-2 bg-[#d9d9d9]'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center mb-5'>
                        <div className='w-[70%] lg:w-[60%]'>
                            <label htmlFor="phone" className='font-arial text-xl font-bold text-start block mb-2'>Telefono</label>
                            <div className='w-full p-2 bg-[#d9d9d9] flex flex-row items-center justify-between'>
                                <PhoneInput
                                    country={'it'}
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    buttonClass='w-[45px] p-2 bg-[#d9d9d9]'
                                    dropdownClass='w-full p-2 bg-[#d9d9d9]'
                                    inputClass='w-full p-2 bg-[#d9d9d9]'
                                    preferredCountries={['it']} // Mostra il paese predefinito in cima
                                />
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center mb-5'>
                        <div className='w-[70%] lg:w-[60%]'>
                            <label htmlFor="email" className='font-arial text-xl font-bold text-start block mb-2'>Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={handleEmailChange}
                                className='w-full p-2 bg-[#d9d9d9]'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center mb-5'>
                        <div className='w-[70%] lg:w-[60%]'>
                            <label htmlFor="password" className='font-arial text-xl font-bold text-start block mb-2'>Password</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                className='w-full p-2 bg-[#d9d9d9]'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center mb-5'>
                        <div className='w-[70%] lg:w-[60%]'>
                            <label htmlFor="confirm" className='font-arial text-xl font-bold text-start block mb-2'>Conferma password</label>
                            <input
                                type="password"
                                name="confirm"
                                id="confirm"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                className='w-full p-2 bg-[#d9d9d9]'
                            />
                        </div>
                    </div>
                    <div className='flex justify-center'>
                        <input
                            type="submit"
                            value="Registrati"
                            className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
