import React, { useState, useEffect } from 'react';
import Navbar from './components/navbar';
import Footer from './components/footer';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import ScrollToTop from './components/scrollToTop';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessagePopUp from './components/messagePopUp';
import ConfirmPopUp from './components/confirmPopUp';
import Dashboard from './components/content_dashboard';
import CodeUsage from './components/codeUsage';
import UserOrders from './components/userOrders';
import Plate from './components/plate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useRecoveryContext } from './provider/provider';

const UserPage = () => {
    const [userInfo, setUserInfo] = useState({});
    const [newUsername, setNewUsername] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [showModifier, setShowModifier] = useState(false);
    const navigate = useNavigate();

    const [surveyInfo, setSurveyInfo] = useState([]);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const [popupConfirmLogout, setPopupConfirmLogout] = useState(false);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');

    const handleUsernameChange = (e) => setNewUsername(e.target.value);
    const handlePhoneChange = (value) => setNewPhone(value);
    const handleEmailChange = (e) => setNewEmail(e.target.value);

    const [isAdmin, setIsAdmin] = useState(false);

    const { initialData } = useRecoveryContext(); //check survey data

    useEffect(() => {
        const fetchInfo = async () => {

            try {
                const response = await axios.get('http://localhost:8080/api/user-info', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.status === 200) {
                    setUserInfo(response.data);
                    if (response.data.administrator) {
                        setIsAdmin(true);
                    }
                    return;
                }

            } catch (error) {

                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }
                setMessagePopup(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }
        }

        const fetchOrdersCategory = async () => {

            try {
                const response = await axios.get('http://localhost:8080/api/user-questionnaires', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.status === 200) {
                    setSurveyInfo(response.data.surveyInfo);
                    return;
                }

            } catch (error) {

                if (error.response && error.response.status === 401) {
                    return;
                }
                setMessagePopup(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }

        }

        fetchInfo();
        fetchOrdersCategory();


    }, []);

    const logout = async () => {
        try {
            const response = await axios.post('http://localhost:8080/api/logout', {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.status === 200) {
                console.log('Logout effettuato con successo');
            } else {
                setMessagePopup(`Errore durante l'invio della richiesta di logout: ${response.statusText}`);
                setButtonPopup(true);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessagePopup(`Errore durante l'invio della richiesta di logout: ${error.message}`);
            setButtonPopup(true);
        }

        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleLogOut = async () => {
        setMessageConfirm('Sei sicuro di voler uscire?');
        setPopupConfirmLogout(true);
    };

    const deleteAccount = async () => {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.delete('http://localhost:8080/api/delete-account', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                console.log('Account cancellato con successo');
                localStorage.removeItem('token');
                navigate('/');
            } else {
                console.error('Error:', response.statusText);
                setMessagePopup(`Errore durante la cancellazione dell'account: ${response.statusText}`);
                setButtonPopup(true);
            }
        } catch (error) {
            console.error('An error occurred during account deletion:', error);
            setMessagePopup(`Errore durante la cancellazione dell'account: ${error.message}`);
            setButtonPopup(true);

            if (error.response && error.response.status === 403) {
                setMessagePopup('Non sei autorizzato a cancellare questo account');
                setButtonPopup(true);
            } else {
                setMessagePopup(`Errore durante la cancellazione dell'account: ${error.message}`);
                setButtonPopup(true);
            }
        }
    };



    const handleDeleteAccount = async () => {
        setMessageConfirm('Sei sicuro di voler cancellare il tuo account?');
        setPopupConfirmDelete(true);
    };

    const handleUsernameModifier = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await axios.put('http://localhost:8080/api/update-username', { username: newUsername }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                setMessagePopup("Username aggiornato con successo");
                setButtonPopup(true);
                setUserInfo({ ...userInfo, username: newUsername });
            }
        } catch (error) {
            setMessagePopup(`Errore durante l'aggiornamento del nome utente: ${error.message}`);
            setButtonPopup(true);
        }
    };

    const handlePhoneModifier = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        setNewPhone(`+${newPhone}`);
        try {
            const response = await axios.put('http://localhost:8080/api/update-phone', { phone_number: newPhone }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                setMessagePopup("Telefono aggiornato con successo");
                setButtonPopup(true);
                setUserInfo({ ...userInfo, phone_number: response.data.newPhone });
            }
        } catch (error) {
            setMessagePopup(`Errore durante l'aggiornamento del numero di telefono: ${error.message}`);
            setButtonPopup(true);
        }
    };

    const handleEmailModifier = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await axios.put('http://localhost:8080/api/update-email', { email: newEmail }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                setMessagePopup("Email aggiornata con successo");
                setButtonPopup(true);
                setUserInfo({ ...userInfo, email: response.data.email || newEmail });
            }

        } catch (error) {
            setMessagePopup(`Errore durante l'aggiornamento dell'email: ${error.message}`);
            setButtonPopup(true);
        }
    };



    return (
        <div className="flex flex-col min-h-screen">
            <ScrollToTop />
            <Navbar />
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteAccount}>
                {messageConfirm}
            </ConfirmPopUp>
            <ConfirmPopUp
                trigger={popupConfirmLogout}
                setTrigger={setPopupConfirmLogout}
                onButtonClick={logout}>
                {messageConfirm}
            </ConfirmPopUp>

            <div className="flex-grow text-arial text-xl p-4">
                <h1 className="text-3xl font-bold text-black text-center pb-10">
                    Ciao {userInfo ? userInfo.username : ''}
                    {isAdmin && (
                        <FontAwesomeIcon icon={faCrown} className="text-yellow-500 ml-2 rotate-45 relative bottom-5 right-4" title="Admin" />
                    )}
                </h1>

                <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 z-10 mx-2 md:mx-14 h-[600px] lg:h-[300px]">
                    <div className="w-full bg-[#d9d9d9] p-4 rounded-lg flex-1">
                        <h2 className="text-2xl font-bold">Informazioni personali</h2>
                        <div className="pb-5">
                            <p><strong>Username:</strong> {userInfo ? userInfo.username : ''}</p>
                            <p><strong>Email:</strong> {userInfo ? userInfo.email : ''}</p>
                            <p className='flex flex-row gap-2'><strong>Telefono:</strong> {userInfo ? (userInfo.phone_number ? userInfo.phone_number : <div className='text-gray-400'>Inserisci il tuo numero di telefono</div>) : ''}</p>
                        </div>
                        <div className="flex justify-center relative top-20">
                            <button
                                className="p-2 w-[150px] z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                onClick={() => setShowModifier(!showModifier)}
                            >
                                Modifica
                            </button>
                        </div>
                    </div>
                    <CodeUsage />
                </div>

                <div className={`flex flex-col items-center justify-center text-arial text-xl p-4 mx-2 md:mx-14 my-4 border shadow-lg rounded-lg ${showModifier ? '' : 'hidden'}`}>
                    <h2 className="text-3xl font-bold text-black text-center pb-10">Modifica credenziali</h2>

                    <form className='mx-auto md:w-[80%] mb-4' onSubmit={handleUsernameModifier}>
                        <label htmlFor="username" className="block mb-2">Username</label>
                        <div className='flex flex-col md:flex-row gap-3 items-center justify-center'>
                            <input
                                type="text"
                                id="username"
                                value={newUsername}
                                onChange={handleUsernameChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            />
                            <div className='flex justify-center'>
                                <input type='submit' value='Modifica username' className="my-3 p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" />
                            </div>
                        </div>

                    </form>

                    <form className='mx-auto md:w-[80%]' onSubmit={handlePhoneModifier}>
                        <label htmlFor="phone" className="block mb-2">Telefono</label>
                        <div className='flex flex-col md:flex-row gap-3 items-center justify-center'>
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
                                <input type='submit' value='Modifica telefono' className="my-3 p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" />
                            </div>
                        </div>
                    </form>

                    <form className='mx-auto md:w-[80%] mb-4' onSubmit={handleEmailModifier}>
                        <label htmlFor="email" className="block mb-2">email</label>
                        <div className='flex flex-col md:flex-row gap-3 items-center justify-center'>
                            <input
                                type="email"
                                id="email"
                                value={newEmail}
                                onChange={handleEmailChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            />
                            <div className='flex justify-center'>
                                <input type='submit' value='Modifica email' className="my-3 p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" />
                            </div>
                        </div>

                    </form>

                </div>

                {surveyInfo.length > 0 && (
                    <div className="bg-[#d9d9d9] text-arial text-xl p-6 mx-4 md:mx-14 my-6 border border-gray-300 rounded-lg">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Questionari disponibili</h1>
                        {surveyInfo.map((info) => (
                            <div key={info.order_id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                                <div className='flex flex-col md:flex-row justify-between'>
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Questionario per la categoria: {info.product_category}</h2>
                                    <div className="text-gray-600">Punteggio: <span className="font-semibold text-gray-800">{info.total_score}</span></div>
                                </div>
                                <div className='flex justify-center md:justify-start'>
                                    <button className="p-2 w-auto z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]">
                                        <Link to={`/questionario/${info.product_category}?param1=${info.order_id}&param2=${info.product_category}`}>
                                            Accedi al questionario
                                        </Link>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}


                <Link to="/buildings">
                    <div className="bg-[#d9d9d9] text-arial text-xl p-4 mx-2 md:mx-14 my-4 border rounded-lg hover:trasform hover:scale-105 duration-300">
                        <h1 className="text-2xl font-bold text-black text-center">I tuoi edifici</h1>
                    </div>
                </Link>

                <Plate />
                <UserOrders />

                {isAdmin && <Dashboard />}
                <div className='flex flex-col md:flex-row gap-3 mt-10 justify-center'>
                    <div className="w-full md:w-[20%] flex justify-center">
                        <button className='p-2 w-full z-10 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black' onClick={handleLogOut}>
                            Esci
                        </button>
                    </div>
                    <div className="w-full md:w-[20%] flex justify-center">
                        <button className='p-2 w-full z-10 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black' onClick={handleDeleteAccount}>
                            Elimina account
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default UserPage;