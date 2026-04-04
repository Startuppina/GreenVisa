import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { useRecoveryContext } from "../provider/provider";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

function UserDataModifier({ userInfo, setUserInfo, color = 'transparent' }) {

    const [newUsername, setNewUsername] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');
    // const [newCompanyName, setNewCompanyName] = useState('');
    // const [newLegalHeadquarter, setNewLegalHeadquarter] = useState('');
    // const [newPiva, setNewPiva] = useState('');
    const [newTaxCode, setNewTaxCode] = useState('');
    const [newTurnover, setNewTurnover] = useState('');

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const { triggerRefresh } = useRecoveryContext();

    const handleUsernameChange = (e) => setNewUsername(e.target.value);
    const handlePhoneChange = (value) => setNewPhone(value);
    const handleEmailChange = (e) => setNewEmail(e.target.value);
    // const handleCompanyNameChange = (e) => setNewCompanyName(e.target.value);
    // const handleLegalHeadquarterChange = (e) => setNewLegalHeadquarter(e.target.value);
    const handleTurnoverChange = (e) => setNewTurnover(e.target.value);
    // const handlePivaChange = (e) => setNewPiva(e.target.value);
    const handleTaxCodeChange = (e) => setNewTaxCode(e.target.value.toUpperCase());

    const handleUsernameModifier = async (e) => {
        e.preventDefault();


        try {
            const response = await axios.put(`/api/update-username`, { username: newUsername }, {
                withCredentials: true,
            });

            if (response.status === 200) {
                setMessagePopup("Username aggiornato con successo");
                setButtonPopup(true);
                setNewUsername('');
                triggerRefresh();
                setUserInfo({ ...userInfo, username: newUsername });
            }
        } catch (error) {
            setMessagePopup(error.response?.data?.message || error.message);
            setButtonPopup(true);
        }
    };

    const handlePhoneModifier = async (e) => {
        e.preventDefault();


        setNewPhone(`+${newPhone}`);
        try {
            const response = await axios.put(`/api/update-phone`, { phone_number: newPhone }, {
                withCredentials: true,
            });

            if (response.status === 200) {
                setMessagePopup("Telefono aggiornato con successo");
                setButtonPopup(true);
                setNewPhone('');
                triggerRefresh();
                setUserInfo({ ...userInfo, phone_number: response.data.newPhone });
            }
        } catch (error) {
            setMessagePopup(error.response?.data?.message || error.message);
            setButtonPopup(true);
        }
    };

    const handleEmailModifier = async (e) => {
        e.preventDefault();


        try {
            const response = await axios.put(`/api/update-email`, { email: newEmail }, {
                withCredentials: true,
            });

            if (response.status === 200) {
                setMessagePopup("Email aggiornata con successo");
                setButtonPopup(true);
                setNewEmail('');
                triggerRefresh();
                setUserInfo({ ...userInfo, email: response.data.email || newEmail });
            }

        } catch (error) {
            setMessagePopup(error.response?.data?.message || error.message);
            setButtonPopup(true);
        }
    };

    // const handleCompanyNameModifier = async (e) => {
    //     e.preventDefault();
    //    
    //     try {
    //         const response = await axios.put(`/api/update-company-name`, { company_name: newCompanyName }, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         });
    //         if (response.status === 200) {
    //             setMessagePopup("Nome azienda aggiornato con successo");
    //             setButtonPopup(true);
    //             setNewCompanyName('');
    //             triggerRefresh();
    //             setUserInfo({ ...userInfo, company_name: newCompanyName });
    //         }
    //     } catch (error) {
    //         setMessagePopup(error.response?.data?.message || error.message);
    //         setButtonPopup(true);
    //     }
    // }

    // const handlePivaModifier = async (e) => {
    //     e.preventDefault();
    //    

    //     try {
    //         const response = await axios.put(`/api/update-piva`, { piva: newPiva }, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         });
    //         if (response.status === 200) {
    //             setMessagePopup("Partita IVA aggiornata con successo");
    //             setButtonPopup(true);
    //             setNewPiva('');
    //             triggerRefresh();
    //             setUserInfo({ ...userInfo, p_iva: newPiva });
    //         }
    //     } catch (error) {
    //         setMessagePopup(error.response?.data?.message || error.message);
    //         setButtonPopup(true);
    //     }
    // }

    const handleTaxCodeModifier = async (e) => {
        e.preventDefault();


        try {
            const response = await axios.put(`/api/update-tax-code`, { tax_code: newTaxCode }, {
                withCredentials: true,
            });
            if (response.status === 200) {
                setMessagePopup("Codice fiscale aggiornato con successo");
                setButtonPopup(true);
                setNewTaxCode('');
                triggerRefresh();
                setUserInfo({ ...userInfo, tax_code: newTaxCode });
            }
        } catch (error) {
            setMessagePopup(error.response?.data?.message || error.message);
            setButtonPopup(true);
        }
    }

    // const handleLegalHeadquarterModifier = async (e) => {
    //     e.preventDefault();
    //    
    //     try {
    //         const response = await axios.put(`/api/update-legal-headquarter`, { legal_headquarter: newLegalHeadquarter }, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         });
    //         if (response.status === 200) {
    //             setMessagePopup("Sede legale aggiornata con successo");
    //             setButtonPopup(true);
    //             setNewLegalHeadquarter('');
    //             triggerRefresh();
    //             setUserInfo({ ...userInfo, legal_headquarter: newLegalHeadquarter });
    //         }
    //     } catch (error) {
    //         setMessagePopup(`Errore durante l'aggiornamento della sede legale: ${error.message}`);
    //         setButtonPopup(true);
    //     }
    // }

    const handleTurnoverModifier = async (e) => {
        e.preventDefault();

        console.log("newTurnover:", newTurnover);
        try {
            const response = await axios.put(`/api/update-turnover`, { turnover: newTurnover }, {
                withCredentials: true,
            });
            if (response.status === 200) {
                setMessagePopup("Fatturato aggiornato con successo");
                setButtonPopup(true);
                setNewTurnover('');
                triggerRefresh();
                setUserInfo({ ...userInfo, turnover: newTurnover });
            }
        } catch (error) {
            setMessagePopup(error.response?.data?.message || error.message);
            setButtonPopup(true);
        }
    }

    const [activeInput, setActiveInput] = useState(null);

    const toggleSection = (input) => {
        setActiveInput(activeInput === input ? null : input);
    };



    return (
        <div className={`flex flex-col items-center justify-center text-arial text-xl p-4 lg:mx-14 lg:my-4 border shadow-lg rounded-lg`} style={{ backgroundColor: color }}>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <h2 className="text-3xl font-bold text-black text-center pb-10">Modifica credenziali</h2>

            {/* Bottoni di navigazione per le sezioni */}
            <div className="flex flex-wrap justify-center mb-8 gap-3">
                <button
                    className={`p-2 text-sm md:text-xl w-auto ${activeInput === 'username' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} rounded-lg border-2 border-[#2d7044] hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                    onClick={() => toggleSection('username')}
                >
                    Username
                </button>
                {/* <button
                    className={`p-2 text-sm md:text-xl w-auto ${activeInput === 'company' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} rounded-lg border-2 border-[#2d7044] hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                    onClick={() => toggleSection('company')}
                >
                    Ragione Sociale
                </button> */}
                <button
                    className={`p-2 text-sm md:text-xl w-auto ${activeInput === 'email' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} rounded-lg border-2 border-[#2d7044] hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                    onClick={() => toggleSection('email')}
                >
                    Email
                </button>
                <button
                    className={`p-2 text-sm md:text-xl w-auto ${activeInput === 'phone' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} rounded-lg border-2 border-[#2d7044] hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                    onClick={() => toggleSection('phone')}
                >
                    Telefono
                </button>
                {/* <button
                    className={`p-2 text-sm md:text-xl w-auto ${activeInput === 'piva' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} rounded-lg border-2 border-[#2d7044] hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                    onClick={() => toggleSection('piva')}
                >
                    Partita IVA
                </button> */}
                <button
                    className={`p-2 text-sm md:text-xl w-auto ${activeInput === 'tax_code' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} rounded-lg border-2 border-[#2d7044] hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                    onClick={() => toggleSection('tax_code')}
                >
                    Codice Fiscale
                </button>
                {/* <button
                    className={`p-2 text-sm md:text-xl w-auto ${activeInput === 'headquarter' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} rounded-lg border-2 border-[#2d7044] hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                    onClick={() => toggleSection('headquarter')}
                >
                    Sede Legale
                </button> */}
                <button
                    className={`p-2 text-sm md:text-xl w-auto ${activeInput === 'turnover' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} rounded-lg border-2 border-[#2d7044] hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                    onClick={() => toggleSection('turnover')}
                >
                    Fatturato
                </button>
            </div>


            {/* Sezione per Modifica Username */}
            {activeInput === 'username' && (
                <form onSubmit={handleUsernameModifier} className='mb-6 w-full md:w-[50%]'>
                    <label htmlFor="username" className="block mb-2">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={newUsername}
                        onChange={handleUsernameChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg w-full p-3"
                    />
                    <div className='flex justify-center'>
                        <input
                            type='submit'
                            value='Modifica username'
                            className="mt-3 p-3 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            )}

            {/* Sezione per Modifica Ragione Sociale */}
            {activeInput === 'company' && (
                <form onSubmit={handleCompanyNameModifier} className='mb-6 w-full md:w-[50%]'>
                    <label htmlFor="company_name" className="block mb-2">Ragione Sociale</label>
                    <input
                        type="text"
                        id="company_name"
                        value={newCompanyName}
                        onChange={handleCompanyNameChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg w-full p-3"
                    />
                    <div className='flex justify-center'>
                        <input
                            type='submit'
                            value='Modifica ragione sociale'
                            className="mt-3 p-3 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            )}

            {/* Sezione per Modifica Email */}
            {activeInput === 'email' && (
                <form onSubmit={handleEmailModifier} className='mb-6 w-full md:w-[50%]'>
                    <label htmlFor="email" className="block mb-2">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={newEmail}
                        onChange={handleEmailChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg w-full p-3"
                    />
                    <div className='flex justify-center'>
                        <input
                            type='submit'
                            value='Modifica email'
                            className="mt-3 p-3 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            )}

            {/* Sezione per Modifica Telefono */}
            {activeInput === 'phone' && (
                <form onSubmit={handlePhoneModifier} className='mb-6 w-full md:w-[50%]'>
                    <label htmlFor="phone" className="block mb-2">Telefono</label>
                    <PhoneInput
                        country={'it'}
                        value={newPhone}
                        onChange={handlePhoneChange}
                        buttonClass='w-[45px] p-2 bg-gray-50'
                        dropdownClass='w-full p-2 bg-gray-50'
                        inputStyle={{ width: '100%', height: '50px', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                        preferredCountries={['it']}
                    />
                    <div className='flex justify-center'>
                        <input
                            type='submit'
                            value='Modifica telefono'
                            className="mt-3 p-3 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            )}

            {/* Sezione per Modifica Partita IVA */}
            {activeInput === 'piva' && (
                <form onSubmit={handlePivaModifier} className='mb-6 w-full md:w-[50%]'>
                    <label htmlFor="p_iva" className="block mb-2">Partita IVA</label>
                    <input
                        type="text"
                        id="p_iva"
                        value={newPiva}
                        onChange={handlePivaChange}
                        maxlength="11"

                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg w-full p-3"
                    />
                    <div className='flex justify-center'>
                        <input
                            type='submit'
                            value='Modifica partita IVA'
                            className="mt-3 p-3 auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            )}

            {/* Sezione per Modifica Codice Fiscale */}
            {activeInput === 'tax_code' && (
                <form onSubmit={handleTaxCodeModifier} className='mb-6 w-full md:w-[50%]'>
                    <label htmlFor="tax_code" className="block mb-2">Codice Fiscale</label>
                    <input
                        type="text"
                        id="tax_code"
                        value={newTaxCode}
                        onChange={handleTaxCodeChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg w-full p-3 uppercase"
                    />
                    <div className='flex justify-center'>
                        <input
                            type='submit'
                            value='Modifica codice fiscale'
                            className="mt-3 p-3 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            )}

            {/* Sezione per Modifica Sede Legale */}
            {activeInput === 'headquarter' && (
                <form onSubmit={handleLegalHeadquarterModifier} className='mb-6 w-full md:w-[50%]'>
                    <label htmlFor="legal_headquarter" className="block mb-2">Sede Legale</label>
                    <input
                        type="text"
                        id="legal_headquarter"
                        value={newLegalHeadquarter}
                        onChange={handleLegalHeadquarterChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg w-full p-3"
                    />
                    <div className='flex justify-center'>
                        <input
                            type='submit'
                            value='Modifica sede legale'
                            className="mt-3 p-3 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            )}

            {/* Sezione per Modifica Sede Legale */}
            {activeInput === 'turnover' && (
                <form onSubmit={handleTurnoverModifier} className='mb-6 w-full md:w-[50%]'>
                    <label htmlFor="Turnover" className="block mb-2">Fatturato</label>
                    <input
                        type="text"
                        id="Turnover"
                        value={newTurnover}
                        onChange={handleTurnoverChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg w-full p-3"
                    />
                    <div className='flex justify-center'>
                        <input
                            type='submit'
                            value='Modifica fatturato'
                            className="mt-3 p-3 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            )}

        </div>
    )
}

export default UserDataModifier