import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate(); // Usa useNavigate per la navigazione programmatica

    const handleEmailChange = (e) => setEmail(e.target.value);
    const handlePasswordChange = (e) => setPassword(e.target.value);
    const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita l'invio del form

        if (password !== confirmPassword) {
            alert('Le password non coincidono');
            return; // Non eseguire ulteriori azioni
        }

        const formData = { email, password };

        try {
            const response = await axios.post('http://localhost:8080/api/signup', formData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                console.log('Signup successful:', response.data);
                navigate('/login'); // Naviga alla pagina di login
            } else {
                console.error('Error:', response.data.msg);
                alert(response.data.msg); // Mostra il messaggio di errore
            }

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <div className="w-screen h-screen bg-[url('/img/login.jpg')] bg-cover bg-center bg-no-repeat m-0 p-0 flex items-center justify-center">
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
                            className="mt-7 font-arial font-semibold text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
