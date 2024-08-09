import React from 'react';
import { useState, useEffect } from 'react';
import Navbar from './components/navbar';
import Footer from './components/footer';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import ScrollToTop from './components/scrollToTop';
import {useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessagePopUp from './components/messagePopUp';
import ConfirmPopUp from './components/confirmPopUp';

const UserPage = () => {
    const [userInfo, setUserInfo] = useState({});
    const [newUsername, setNewUsername] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [showModifier, setShowModifier] = useState(false);
    const navigate = useNavigate();

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const [popupConfirm, setPopupConfirm] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');


    const handleUsernameChange = (e) => setNewUsername(e.target.value);
    const handlePhoneChange = (value) => setNewPhone(value);

    
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/user-info', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if(response.status === 200) {
                    setUserInfo(response.data);
                    return;
                }

            } catch (error) {
                //alert(error.response?.data?.msg || error.message);
                setMessagePopup(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }
        }

    fetchInfo();
    }, []);

    const logout = async () => {
        try {
            // Effettua una richiesta di logout al server per invalidare il token
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

        // Rimuovi il token dal localStorage e reindirizza
        localStorage.removeItem('token');
        navigate('/login');
    };


    const handleLogOut = async () => {
        setMessageConfirm('Sei sicuro di voler uscire?');
        setPopupConfirm(true);
    };

    const deleteAccount = async () => {
        
        try {
            const token = localStorage.getItem('token');
            console.log('Token:', token); // Debugging: stampa il token

            // Effettua una richiesta di delete al server
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
                console.error('Forbidden error');
                setMessagePopup('Non sei autorizzato a cancellare questo account');
                setButtonPopup(true);
            } else {
                console.error(`Errore durante la cancellazione dell'account: ${error.message}`);
                setMessagePopup(`Errore durante la cancellazione dell'account: ${error.message}`);
                setButtonPopup(true);
            }
        }
    };

    const handleDeleteAccount = async () => {
        //const confirmation = window.confirm('Sei sicuro di voler cancellare il tuo account?');
        setMessageConfirm('Sei sicuro di voler cancellare il tuo account?');
        setPopupConfirm(true);
        

    };

    const handleUsernameModifier = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        
        try {
            const response = await axios.post('http://localhost:8080/api/update-username', { username: newUsername }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' // Assicurati di inviare i dati come JSON
                    }
                }
            );
    
            if (response.status === 200) {
                console.log('Username updated successfully');
                setMessagePopup("Username aggiornato con successo");
                setButtonPopup(true);
                setUserInfo({ ...userInfo, username: newUsername });
            } 
        } catch (error) {
            console.error(`Errore durante l'aggiornamento del nome utente: ${error.message}`);
            setMessagePopup(`Errore durante l'aggiornamento del nome utente: ${error.message}`);
            setButtonPopup(true);
        }
    };

    const handlePhoneModifier = async (e) => {
        e.preventDefault(); 

        const token = localStorage.getItem('token');
        
        setNewPhone(`+${newPhone}`);
        try {
            const response = await axios.post('http://localhost:8080/api/update-phone', { phone_number: newPhone }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' // Assicurati di inviare i dati come JSON
                    }
                }
            );
    
            if (response.status === 200) {
                
                setMessagePopup("Telefono aggiornato con successo");
                setButtonPopup(true);
                setUserInfo({ ...userInfo, phone_number: response.data.newPhone });
                // Esegui ulteriori azioni se necessario, ad esempio aggiornare lo stato
                // setSomething(); // Completa questa parte secondo le tue necessità
            }
        } catch (error) {
            console.error(`Errore durante l\'aggiornamento del numero di telefono: ${error.message}`);
            setMessagePopup(`Errore durante l'aggiornamento del numero di telefono: ${error.message}`);
            setButtonPopup(true);
            //alert(error.response?.data?.message || error.message); // Cambia `msg` in `message` per coerenza con il backend
        }
    };
    
    

  return (
    <div className='w-full'>
        <ScrollToTop />
        <Navbar />
        <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
            {messagePopup}
        </MessagePopUp>
        <ConfirmPopUp 
            trigger={popupConfirm} 
            setTrigger={setPopupConfirm} 
            onButtonClick={deleteAccount}>
            {messageConfirm}
        </ConfirmPopUp>
        <ConfirmPopUp 
            trigger={popupConfirm} 
            setTrigger={setPopupConfirm} 
            onButtonClick={logout}>
            {messageConfirm}
        </ConfirmPopUp>


        <div className='text-arial text-xl p-4'>
            <h1 className="text-3xl font-bold text-black text-center pb-10">Ciao {userInfo ? userInfo.username : ''}</h1>
            
            <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-[10%]'>
                <div className='w-full md:w-[45%] bg-[#d9d9d9] p-4 rounded-lg'>
                    <h2 className='text-2xl font-bold'>Informazioni personali</h2>
                    <div className='pb-5'>
                        <p><strong>Username:</strong> {userInfo ? userInfo.username : ''}</p>
                        <p><strong>Email:</strong> {userInfo ? userInfo.email : ''}</p>
                        <p><strong>Telefono:</strong> {userInfo ? userInfo.phone_number : ''}</p>
                    </div>
                    <div className='flex justify-center'>
                        <button className='p-2 w-[150px] z-10 bg-[#2d7044] text-black rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]' onClick={() => setShowModifier(!showModifier)}>Modifica</button>
                    </div>
                </div>
                <div className='w-full md:w-[45%] bg-[#d9d9d9] p-4 rounded-lg'>
                    <h2 className='text-2xl font-bold'>Certificazioni acquistate</h2>
                    <p>Titolo: Green Visa</p>
                </div>
            </div>

            <div className={`flex flex-col items-center justify-center text-arial text-xl p-4 ${showModifier ? '' : 'hidden'}`}>
                <h2 className="text-3xl font-bold text-black text-center pb-10">Modifica credenziali</h2>
                
                <form className='mx-auto md:w-[40%] mb-4' onSubmit={handleUsernameModifier}>
                    <label htmlFor="username" className="block mb-2">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={newUsername}
                        onChange={handleUsernameChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                    <div className='flex justify-center'>
                        <input type='submit' value='Modifica username' className="my-3 p-2 w-auto bg-[#2d7044] text-black rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"/>
                    </div>
                </form>

                <form className='mx-auto md:w-[40%]' onSubmit={handlePhoneModifier}>
                    <label htmlFor="phone" className="block mb-2">Telefono</label>
                    <div className='w-full p-2 bg-[#d9d9d9] flex flex-row items-center'>
                        <PhoneInput
                            country={'it'}
                            value={newPhone}
                            onChange={handlePhoneChange}
                            buttonClass='w-[45px] p-2 bg-[#d9d9d9]'
                            dropdownClass='w-full p-2 bg-[#d9d9d9]'
                            inputClass='w-full p-2 bg-[#d9d9d9]'
                            preferredCountries={['it']}
                        />
                    </div>
                    <div className='flex justify-center'>
                        <input type='submit' value='Modifica telefono' className="my-3 p-2 w-auto bg-[#2d7044] text-black rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"/>
                    </div>
                </form>
            </div>

            <div className='flex flex-col md:flex-row gap-3 mt-10 mb-6 justify-center'>
                <div className="w-full md:w-[20%] flex justify-center">
                    <button className='p-2 w-full z-10 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black' onClick={handleLogOut}>
                        Logout
                    </button>
                </div>
                <div className="w-full md:w-[20%] flex justify-center">
                    <button className='p-2 w-full z-10 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black' onClick={handleDeleteAccount}>
                        Delete account
                    </button>
                </div>
            </div>
        </div>
        <Footer />
    </div>

  );
};

export default UserPage;
