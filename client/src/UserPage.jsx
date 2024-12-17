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
import UserDataModifier from './components/userDataModifier';

const UserPage = () => {
    const [userInfo, setUserInfo] = useState({});
    const [showModifier, setShowModifier] = useState(false);
    const navigate = useNavigate();

    const [showUserInfo, setShowUserInfo] = useState(true);
    const [showDashboard, setShowDashboard] = useState(false);

    const [surveyInfo, setSurveyInfo] = useState([]);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const [popupConfirmLogout, setPopupConfirmLogout] = useState(false);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');


    const [isAdmin, setIsAdmin] = useState(false);

    const [userInfoComplete, setUserInfoComplete] = useState(false);
    const { trigger } = useRecoveryContext();

    const isUserInfoComplete = (userInfo) => {
        console.log("userInfo:", userInfo.phone_number, userInfo.legal_headquarter, userInfo.tax_code, userInfo.piva);
        return userInfo.phone_number === null || userInfo.legal_headquarter === null || userInfo.tax_code === null || userInfo.p_iva === undefined
    };

    useEffect(() => {
        const fetchInfo = async () => {

            console.log("env", import.meta.env.VITE_REACT_SERVER_ADDRESS);

            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/user-info`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.status === 200) {
                    setUserInfo(response.data);
                    setUserInfoComplete(isUserInfoComplete(response.data));
                    console.log("userInfoComplete:", userInfoComplete);
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
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/user-questionnaires`, {
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


    }, [trigger]);

    const logout = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/logout`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.status === 200) {
                console.log('Logout effettuato con successo');
                localStorage.removeItem('activeSection');
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

            const response = await axios.delete(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/delete-account`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                console.log('Account cancellato con successo');
                localStorage.removeItem('token');
                localStorage.removeItem('activeSection')
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

    const [approvations, setApprovations] = useState([]);

    useEffect(() => {
        const fetchUserApprovations = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-approved-requests`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setApprovations(response.data);
                } else if (response.status === 204) {
                    console.log('No approvations found');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
        fetchUserApprovations();
    }, []);

    const handleCancel = async (approvation_id) => {
        const token = localStorage.getItem('token');

        try {
            // Effettua la richiesta di aggiornamento
            const response = await axios.put(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/cancel-approvation/${approvation_id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Verifica che la risposta sia stata ricevuta con successo
            if (response.status === 200) {
                // Aggiorna lo stato per rimuovere l'approvazione cancellata
                setApprovations((prevApprovations) =>
                    prevApprovations.filter((approvation) => approvation.approvation_id !== approvation_id)
                );
            } else {
                // Gestisci l'errore se il codice di stato non è 200
                setMessagePopup('Errore durante la cancellazione dell\'approvazione.');
                setButtonPopup(true);
            }

        } catch (error) {
            // Gestisci l'errore di rete o di altro tipo
            setMessagePopup(`Errore durante la cancellazione dell'approvazione: ${error.message}`);
            setButtonPopup(true);
        }
    };

    const [activeSection, setActiveSection] = useState('user'); // Stato per tenere traccia della sezione attiva

    const handleSwitch = (section) => {
        setActiveSection(section);
        localStorage.setItem('activeSection', section); // Memorizza la sezione nel localStorage
    };

    useEffect(() => {
        const storedSection = localStorage.getItem('activeSection');
        if (storedSection) {
            setActiveSection(storedSection);
        } else {
            setActiveSection('user'); // Se non c'è una sezione salvata, di default mostra la sezione 'user'
        }
    }, []);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth); // Stato per tenere traccia della larghezza della finestra per mostrare o meno userData modifier in un certo modo

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);

        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    //Chiamata che verifica se l'utente ha completato un questionario e ha calcolto le emissioni di CO2 per almeno un edificio
    const [isUserCertificable, setIsUserCertifiable] = useState(false);
    useEffect(() => {
        const fetchIsUserCertifiable = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/is-user-certificable`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setIsUserCertifiable(response.data.isCertificable);
                    console.log(response.data.isCertificable);
                }
            } catch (error) {
                console.log('Errore nella verifa della certificabilità dell\'utente:');
                setMessagePopup('Errore');
                setButtonPopup(true);
            }
        }

        fetchIsUserCertifiable();
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <ScrollToTop />
            <Navbar />
            <main className="min-h-screen">

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

                <div className="flex-col space-between text-arial text-xl md:p-4">

                    <h1 className="text-3xl font-bold text-black text-center pb-5">
                        Ciao {userInfo ? userInfo.username : ''}
                        {isAdmin && (
                            <FontAwesomeIcon icon={faCrown} className="text-yellow-500 ml-2" title="Admin" />
                        )}
                    </h1>

                    {isAdmin && (
                        <div>
                            {/* Sezione per selezionare tra Utente e Amministratore */}
                            <div className='flex justify-center items-center gap-10 pb-10 font-bold'>
                                <div
                                    onClick={() => handleSwitch('user')}
                                    className={`cursor-pointer ${activeSection === 'user' ? 'text-[#2d7044]' : 'text-gray-500'}`}
                                >
                                    Utente
                                </div>
                                <div
                                    onClick={() => handleSwitch('admin')}
                                    className={`cursor-pointer ${activeSection === 'admin' ? 'text-[#2d7044]' : 'text-gray-500'}`}
                                >
                                    Amministratore
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'user' && (
                        <div >
                            {userInfoComplete && (
                                <p className="text-center text-red-500 font bold text-xl uppercase mb-4">Hai delle informazioni mancanti. Completa il tuo account</p>
                            )}

                            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 z-10 mx-2 lg:mx-14  h-auto lg:h-[330px]">
                                <div className="w-full bg-[#d9d9d9] p-4 rounded-xl flex-1">
                                    <h2 className="text-2xl font-bold">Informazioni personali</h2>
                                    <div className="pb-5">
                                        <p className='flex  md:justify-normal gap-2'><strong>Username: </strong> {userInfo ? userInfo.username : ''}</p>
                                        <p className='flex  md:justify-normal gap-2'><strong>Ragione sociale:</strong> {userInfo ? userInfo.company_name : ''}</p>
                                        <p className='flex  md:justify-normal gap-2'><strong>Email:</strong> {userInfo ? userInfo.email : ''}</p>
                                        <p className='flex  md:justify-normal gap-2'><strong>Telefono:</strong> {userInfo ? (userInfo.phone_number ? userInfo.phone_number : <span className='text-gray-400'>Inserisci il tuo numero di telefono</span>) : ''}</p>
                                        <p className='flex  md:justify-normal gap-2'><strong>Partita IVA:</strong> {userInfo ? (userInfo.p_iva ? userInfo.p_iva : <span className='text-gray-400'>Inserisci la tua partita IVA</span>) : ''}</p>
                                        <p className='flex  md:justify-normal gap-2'><strong>Codice fiscale:</strong> {userInfo ? (userInfo.tax_code ? userInfo.tax_code : <span className='text-gray-400'>Inserisci il tuo codice fiscale</span>) : ''}</p>
                                        <p className='flex  md:justify-normal gap-2'><strong>Sede legale:</strong> {userInfo ? (userInfo.legal_headquarter ? userInfo.legal_headquarter : <span className='text-gray-400'>Inserisci la tua sede legale</span>) : ''}</p>
                                    </div>
                                    <div className="flex justify-center mb-4">
                                        <button
                                            className="p-2 w-[150px] z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                            onClick={() => setShowModifier(!showModifier)}
                                        >
                                            Modifica
                                        </button>

                                    </div>
                                    {showModifier && windowWidth <= 1024 && (
                                        <div className="block">
                                            <UserDataModifier userInfo={userInfo} setUserInfo={setUserInfo} color={"white"} />
                                        </div>
                                    )}
                                </div>
                                <CodeUsage />
                            </div>

                            {showModifier && windowWidth > 1024 && (

                                <UserDataModifier userInfo={userInfo} setUserInfo={setUserInfo} />

                            )}

                            {/*surveyInfo.length > 0*/ 1 && (
                                <Link to="/buildings">
                                    <div className="bg-[#2d7044] text-white text-xl p-4 mx-2 lg:mx-14 my-4 border border-[#0056b3] rounded-xl shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl duration-300 cursor-pointer">
                                        <h1 className="text-2xl font-bold text-center">
                                            I tuoi edifici
                                        </h1>
                                        <p className="text-center">Accedi</p>
                                    </div>
                                </Link>
                            )}

                            {isUserCertificable && (
                                <div className='flex justify-center'>
                                    <button className="w-full bg-[#2d7044] text-white text-xl p-4 mx-2 lg:mx-14 border border-[#0056b3] rounded-xl shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl duration-300 cursor-pointer"
                                        onClick={() => navigate('/Certification')}
                                    >
                                        Accedi alla certificazione</button>
                                </div>
                            )}


                            {surveyInfo.length > 0 && (
                                <div className="bg-[#d9d9d9] text-arial text-xl p-6 mx-2 lg:mx-14 my-4 border border-gray-300 rounded-xl">
                                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Questionari disponibili</h1>
                                    {surveyInfo.map((info) => (
                                        <div key={info.order_id} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                                            <div className='flex flex-col md:flex-row justify-between'>
                                                <div className='flex flex-col mb-2'>
                                                    <h2 className="text-2xl font-semibold text-gray-800">Questionario per la categoria: {info.product_category}</h2>
                                                    <div className="text-gray-600">Stato: <span className="font-semibold text-gray-800">{info.completed ? 'Completato' : 'Non completato'}</span></div>
                                                </div>
                                                <div className='flex flex-col mb-2 text-right'>
                                                    <div className="text-gray-600">Voto: <span className="font-semibold text-gray-800">{info.total_score}</span> / 10</div>
                                                    {info.product_category === "Certificazione trasporti" && <div className="text-gray-600">Emissioni CO2 da veicoli: <span className="font-semibold text-gray-800">{info.co2emissions} </span>tons CO&#8322;/anno</div>}
                                                </div>
                                            </div>
                                            <div className='flex justify-center md:justify-start mt-2 md:mt-0'>
                                                <button className="p-2 w-[235px] z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]">
                                                    <Link to={`/questionario/${info.product_category}?param1=${info.product_id}&param2=${info.product_category}`}>
                                                        {info.completed ? 'Visualizza questionario' : 'Completa questionario'}
                                                    </Link>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {approvations.length > 0 && (
                                <div className="bg-[#d9d9d9] text-arial text-xl p-6 mx-2 md:mx-14 my-4 border border-gray-300 rounded-xl">
                                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Hai una certificazione di secondo livello approvata</h1>
                                    <p className='pb-4'>Verrai contattato per ulteriori informazioni</p>
                                    {approvations.map((data, index) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                            <div className='flex flex-col md:flex-row justify-between'>
                                                <div className='flex flex-col mb-2'>
                                                    <h2 className="text-xl text-gray-800">Approvazione per la categoria: {data.category}</h2>

                                                </div>
                                                <button className="p-2 w-[200px] z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                                    onClick={() => handleCancel(data.approvation_id)}>
                                                    Nascondi
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/*<Plate />*/}
                            <UserOrders />


                        </div>
                    )}

                    {activeSection === 'admin' && (
                        <div className='h-auto'>
                            {isAdmin && <Dashboard />}
                        </div>
                    )}



                </div>
            </main >
            <div className='flex flex-col md:flex-row gap-3 justify-center mb-4 mt-1'>
                <div className="w-full md:w-[20%] flex justify-center">
                    <button className='p-2 w-[90%] z-10 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black' onClick={handleLogOut}>
                        Esci
                    </button>
                </div>
                {!isAdmin && (
                    <div className="w-full md:w-[20%] flex justify-center">
                        <button className='p-2 w-[90%]   z-10 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black' onClick={handleDeleteAccount}>
                            Elimina account
                        </button>
                    </div>
                )}

            </div>
            <Footer />
        </div >
    );
};

export default UserPage;