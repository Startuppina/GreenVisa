import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from 'axios';
import MessagePopUp from './messagePopUp';
import PassInfo from './passInfo';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passInfo, setPassInfo] = useState(false);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false); // Gestisci il checkbox dei termini
    const [company_name, setCompany_name] = useState('');

    const navigate = useNavigate();

    const handleUsernameChange = (e) => setUsername(e.target.value);
    const handleCompanyNameChange = (e) => setCompany_name(e.target.value);
    const handlePhoneChange = (value) => setPhone(value);
    const handleEmailChange = (e) => setEmail(e.target.value);
    const handlePasswordChange = (e) => setPassword(e.target.value);
    const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);
    const handleTermsChange = (e) => setAcceptedTerms(e.target.checked);
    const toggleShowPassword = () => setShowPassword(!showPassword);
    const togglePassInfo = () => setPassInfo(!passInfo);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessagePopup('Le password non corrispondono');
            setButtonPopup(true);
            return;
        }

        setPhone(`+${phone}`);

        const formData = { username, company_name, email, password, phone };

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/signup`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {

                //reset fields
                setUsername('');
                setCompany_name('');
                setPhone('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setAcceptedTerms(false);

                navigate('/login');
            }

        } catch (error) {
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    return (
        <div className="bg-[url('/img/login.jpg')] bg-cover h-screen bg-center bg-no-repeat py-10 flex items-center justify-center">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>

            <div className="w-full max-w-[95%] sm:max-w-[85%] md:max-w-[70%] lg:max-w-[80%] p-4 h-[83vh] flex flex-col items-center justify-start bg-white rounded-lg shadow-lg overflow-y-auto relative">
                <div className="absolute top-4 left-4 text-arial text-[#2d7044] text-xl font-bold cursor-pointer">
                    <Link to="/">Home</Link>
                </div>

                <div className='flex flex-col items-center justify-center mb-5 mt-4'>
                    <img src="/img/logo.png" alt="logo" className='w-[60%] max-w-[200px] p-0' />
                </div>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-5">
                        <div className="w-full">
                            <label htmlFor="username" className="block text-xl">Nome e cognome del referente</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                value={username}
                                onChange={handleUsernameChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>

                        <div className="w-full">
                            <label htmlFor="company_name" className="block text-xl">Ragione sociale</label>
                            <input
                                type="text"
                                name="company_name"
                                id="company_name"
                                value={company_name}
                                onChange={handleCompanyNameChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-5">
                        <div className="w-full">
                            <label htmlFor="email" className="block text-xl">Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={handleEmailChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>

                        <div className="w-full">
                            <label htmlFor="phone" className="block text-xl">Telefono</label>
                            <PhoneInput
                                country={'it'}
                                value={phone}
                                onChange={handlePhoneChange}
                                buttonClass="w-[45px] p-2 bg-gray-50"
                                dropdownClass="w-full p-2 bg-gray-50"
                                inputStyle={{ width: '100%', height: '42px', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                                preferredCountries={['it']}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-5">
                        <div className="w-full">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <label htmlFor="password" className="block text-xl">Password</label>
                                    <svg
                                        className="cursor-pointer ml-2"
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

                                <div className="flex items-center gap-2">
                                    <span className="text-black">Mostra password</span>
                                    <input
                                        type="checkbox"
                                        name="showPassword"
                                        id="showPassword"
                                        onClick={toggleShowPassword}
                                        className="cursor-pointer"
                                    />
                                </div>
                            </div>

                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>

                        <div className="w-full">
                            <label htmlFor="confirm" className="block text-xl">Conferma password</label>
                            <input
                                type="password"
                                name="confirm"
                                id="confirm"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>
                    </div>

                    <div className="flex items-start w-full  mx-auto mb-5">
                        <div className="h-5">
                            <input
                                id="terms"
                                aria-describedby="terms"
                                type="checkbox"
                                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                                required
                                onChange={handleTermsChange}
                            />
                        </div>

                        <div className="ml-3">
                            <label htmlFor="terms" className="text-black">
                                Accetto i{" "}
                                <a className="text-[#2d7044] hover:underline" href="#">
                                    Termini e Condizioni
                                </a>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <input
                            type="submit"
                            value="Registrati"
                            className="mt-7 font-arial font-bold text-xl w-[50%] sm:w-[40%] md:w-[30%] lg:w-[20%] p-2 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            </div>

        </div>


    );
};

export default Signup;
