import React from 'react';
import { useState, useEffect } from 'react';
import Navbar from './components/navbar';
import Footer from './components/footer';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import ScrollToTop from './components/scrollToTop';
import {useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserPage = () => {
    const [userInfo, setUserInfo] = useState({});
    const [newUsername, setNewUsername] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [showModifier, setShowModifier] = useState(false);
    const navigate = useNavigate();

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
                alert(error.response?.data?.msg || error.message);
            }
        }

    fetchInfo();
    }, []);


    const handleLogOut = async () => {
        // Chiedi conferma all'utente
        const confirmation = window.confirm('Sei sicuro di voler effettuare il logout?');
        
        if (confirmation) {
            try {
                // Effettua una richiesta di logout al server per invalidare il token
                const response = await axios.post('http://localhost:8080/api/logout', {}, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
    
                if (response.status === 200) {
                    console.log('Logout successful');
                } else {
                    console.error(`Logout failed with status: ${response.status}`);
                }
            } catch (error) {
                console.error('An error occurred during logout:', error);
            }
    
            // Rimuovi il token dal localStorage e reindirizza
            localStorage.removeItem('token');
            navigate('/login');
        }
    };

    const handleDeleteAccount = async () => {
        // Chiedi conferma all'utente
        const confirmation = window.confirm('Sei sicuro di voler cancellare il tuo account?');
        
        if (confirmation) {
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
                    console.log('Account deleted successfully');
                    localStorage.removeItem('token');
                    navigate('/');
                } else {
                    console.error(`Account deletion failed with status: ${response.status}`);
                }
            } catch (error) {
                console.error('An error occurred during account deletion:', error);
                if (error.response && error.response.status === 403) {
                    alert('You are not authorized to delete this account.');
                } else {
                    alert('An error occurred. Please try again.');
                }
            }
        }
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
                setUserInfo({ ...userInfo, username: newUsername });
                // Esegui ulteriori azioni se necessario, ad esempio aggiornare lo stato
                // setSomething(); // Completa questa parte secondo le tue necessità
            } 
        } catch (error) {
            alert(error.response?.data?.message || error.message); // Cambia `msg` in `message` per coerenza con il backend
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
                console.log('Phone number updated successfully');
                setUserInfo({ ...userInfo, phone_number: response.data.newPhone });
                // Esegui ulteriori azioni se necessario, ad esempio aggiornare lo stato
                // setSomething(); // Completa questa parte secondo le tue necessità
            }
        } catch (error) {
            alert(error.response?.data?.message || error.message); // Cambia `msg` in `message` per coerenza con il backend
        }
    };
    
    

  return (
    <div className='w-full'>
        <ScrollToTop />
        <Navbar />
        <div className='text-arial text-xl p-4'>
            <h1 className="text-3xl font-bold text-black text-center pb-10">Ciao {userInfo ? userInfo.username : ''}</h1>
            
            <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-[100px]'>
                <div className='w-full md:w-[45%] bg-[#d9d9d9] p-4 rounded-lg'>
                    <h2 className='text-2xl font-bold'>Informazioni personali</h2>
                    <div className='pb-5'>
                        <p><strong>Username:</strong> {userInfo ? userInfo.username : ''}</p>
                        <p><strong>Email:</strong> {userInfo ? userInfo.email : ''}</p>
                        <p><strong>Telefono:</strong> {userInfo ? userInfo.phone_number : ''}</p>
                    </div>
                    <div className='flex justify-center'>
                        <button className='p-2 w-[150px] bg-[#2d7044] text-black rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]' onClick={() => setShowModifier(!showModifier)}>Modifica</button>
                    </div>
                </div>
                <div className='w-full md:w-[45%] bg-[#d9d9d9] p-4 rounded-lg'>
                    <h2 className='text-2xl font-bold'>Certificazioni acquistate</h2>
                    <p>Titolo: Green Visa</p>
                </div>
            </div>

            <div className={`flex flex-col items-center justify-center text-arial text-xl p-4 mt-4 ${showModifier ? '' : 'hidden'}`}>
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

            <div className='flex flex-col md:flex-row gap-3 mt-10 justify-center'>
                <div className="w-full md:w-[20%] flex justify-center">
                    <button className='p-2 w-full bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black' onClick={handleLogOut}>
                        Logout
                    </button>
                </div>
                <div className="w-full md:w-[20%] flex justify-center">
                    <button className='p-2 w-full bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black' onClick={handleDeleteAccount}>
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
