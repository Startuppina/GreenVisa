import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from 'axios';
import MessagePopUp from './messagePopUp';
import PassInfo from './passInfo';
import { debounce } from 'lodash';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passInfo, setPassInfo] = useState(false);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false); // Gestisci il checkbox dei termini
    const [company_name, setCompany_name] = useState('');
    const [legal_headquarter, setLegalHeadquarter] = useState('');
    const [company_website, setCompanyWebsite] = useState('');
    const [pec, setPec] = useState('');
    const [vat, setVat] = useState('');
    const [isValid, setIsValid] = useState(null); // Gestisci lo stato della validazione della partita iva
    const [noCompanyEmail, setNoCompanyEmail] = useState(false);
    const [page, setPage] = useState(1);

    const navigate = useNavigate();

    const handleUsernameChange = (e) => setUsername(e.target.value);
    const handleCompanyNameChange = (e) => setCompany_name(e.target.value);
    const handleLegalHeadquarterChange = (e) => setLegalHeadquarter(e.target.value);
    const handlePhoneChange = (value) => setPhone(value);
    const handleEmailChange = (e) => setEmail(e.target.value);
    const handleConfirmEmailChange = (e) => setConfirmEmail(e.target.value);
    const handlePasswordChange = (e) => setPassword(e.target.value);
    const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);
    const handleTermsChange = (e) => setAcceptedTerms(e.target.checked);
    const handleCompanyWebsiteChange = (e) => setCompanyWebsite(e.target.value);
    const handlePecChange = (e) => setPec(e.target.value);
    const handleVatChange = (e) => {
        const value = e.target.value.toUpperCase();
        setVat(value);
        checkVat(value);
    }
    const handleNoCompanyEmailChange = (e) => setNoCompanyEmail(e.target.checked);
    const toggleShowPassword = () => setShowPassword(!showPassword);
    const togglePassInfo = () => setPassInfo(!passInfo);

    const checkVat = useCallback( // callack utilizzata per evitare il loop
        debounce(async (value) => {
            if (value.length < 3) {
                setIsValid(null);
                return;
            }
            try {
                const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/check-vat`, { vatNumber: value });
                setIsValid(response.data.success);
                setCompany_name(response.data.companyName);
                setLegalHeadquarter(response.data.address);
            } catch (error) {
                console.error('Errore controllo partita IVA:', error);
                setIsValid(false);
                setCompany_name('');
                setLegalHeadquarter('');
            }
        }),
        []
    );

    useEffect(() => {
        if (noCompanyEmail) {
            const emailDomain = email.split("@")[1];
            const websiteDomain = company_website.split("www.")[1];

            if (emailDomain === websiteDomain) {
                setNoCompanyEmail(false);
            }
        }
    }, [email, company_website, noCompanyEmail]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessagePopup('Le password non corrispondono');
            setButtonPopup(true);
            return;
        }

        if (!acceptedTerms) {
            setMessagePopup('Devi accettare i termini e le condizioni');
            setButtonPopup(true);
            return;
        }

        if (!isValid) {
            setMessagePopup('La partita iva non è valida');
            setButtonPopup(true);
            return;
        }

        const emailDomain = email.split("@")[1];
        const websiteDomain = company_website.split("www.")[1];
        console.log(emailDomain);
        console.log(websiteDomain);
        console.log(noCompanyEmail);

        console.log(noCompanyEmail);
        setPhone(`+${phone}`);

        const formData = { username, company_name, email, confirmEmail, password, phone, company_website, pec, vat, noCompanyEmail, legal_headquarter };
        console.log(formData);

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/signup`, formData, {
                withCredentials: true,
            });

            if (response.status === 200) {
                //reset fields
                // setUsername('');
                // setCompany_name('');
                // setPhone('');
                // setEmail('');
                // setConfirmEmail('');
                // setPassword('');
                // setConfirmPassword('');
                // setAcceptedTerms(false);
                // setCompanyWebsite('');
                // setPec('');
                // setVat('');

                if (response.data.notCompanyEmail) {
                    navigate('/VerifyAccountNoCompanyEmail');
                } else {
                    navigate('/VerifyAccount');
                }


            }

        } catch (error) {
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const closePassInfo = () => {
        setPassInfo(false);
    };

    return (
        <div>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>

            {passInfo && <PassInfo onClose={closePassInfo} />}

            <div className="w-full p-10 flex flex-col items-center justify-center overflow-y-auto">
                <div className="w-full text-arial text-start text-[#2d7044] text-xl font-bold cursor-pointer">
                    <Link to="/">Home</Link>
                </div>

                <div className='flex flex-col items-center justify-center mb-5 mt-4'>
                    <img src="/img/logo.png" alt="logo" className='w-[60%] max-w-[200px] p-0' />
                </div>

                <form onSubmit={handleSubmit} className="w-full">

                    <h1 className='text-start font-bold text-[#2d7044] text-lg'>Informazioni del referente</h1>

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
                                type={showPassword ? "text" : "password"}
                                name="confirm"
                                id="confirm"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>
                    </div>

                    <h1 className='text-start font-bold text-[#2d7044] text-lg'>Informazioni Aziendali</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-5">
                        <div className="w-full">
                            <label htmlFor="vat" className="block text-xl mb-2">Partita IVA (formato: codice paese + numero)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="vat"
                                    id="vat"
                                    value={vat}
                                    onChange={handleVatChange}
                                    placeholder="Inserisci la partita IVA"
                                    className={`bg-gray-50 border ${isValid === true ? 'border-green-500' : isValid === false ? 'border-red-500' : 'border-gray-300'} text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 pr-20`} // <- spazio a destra
                                />
                                {isValid !== null && (
                                    <span
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {isValid ? 'Valida' : 'Non valida'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="w-full">
                            <label htmlFor="company_name" className="block text-xl">Ragione sociale</label>
                            <input
                                type="text"
                                name="company_name"
                                id="company_name"
                                value={company_name}
                                onChange={handleCompanyNameChange}
                                className="bg-gray-50 border border-gray-300 text-gray-400 sm:text-sm rounded-lg block w-full p-2.5"
                                readOnly={true}
                            />
                        </div>

                        <div className="w-full">
                            <label htmlFor="company_name" className="block text-xl">Sede legale</label>
                            <input
                                type="text"
                                name="legal_headquarter"
                                id="legal_headquarter"
                                value={legal_headquarter}
                                onChange={handleLegalHeadquarterChange}
                                className="bg-gray-50 border border-gray-300 text-gray-400 sm:text-sm rounded-lg block w-full p-2.5"
                                readOnly={true}
                            />
                        </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-5">

                        <div className="w-full">
                            <label htmlFor="pec" className="block text-xl">PEC</label>
                            <input
                                type="text"
                                name="pec"
                                id="pec"
                                value={pec}
                                onChange={handlePecChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>

                        <div className="w-full">
                            <label htmlFor="company_website" className="block text-xl">Sito web aziendale</label>
                            <input
                                type="text"
                                name="company_website"
                                id="company_website"
                                value={company_website}
                                onChange={handleCompanyWebsiteChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-5">
                        <div className="w-full">
                            <label htmlFor="email" className="block text-xl">Email aziendale</label>
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
                            <label htmlFor="email" className="block text-xl">Conferma email aziendale</label>
                            <input
                                type="email"
                                name="email_confirm"
                                id="email_confirm"
                                value={confirmEmail}
                                onChange={handleConfirmEmailChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                            />
                        </div>


                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center mb-5">

                        <div className="flex items-start w-full  mx-auto mb-5">
                            <div className="h-5">
                                <input
                                    id="noCompanyEmail"
                                    aria-describedby="noCompanyEmail"
                                    type="checkbox"
                                    className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                                    value={noCompanyEmail}
                                    onChange={handleNoCompanyEmailChange}
                                />
                            </div>

                            <div className="ml-3">
                                <label htmlFor="terms" className="text-black">
                                    <a href="#">
                                        Non ho una email aziendale
                                    </a>
                                </label>
                            </div>
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
