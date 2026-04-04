import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const VerifyAccountPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const token = searchParams.get('token');

    useEffect(() => {
        const verifyAccount = async () => {
            try {
                const response = await fetch(`/api/verify?token=${token}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    setTimeout(() => {
                        setStatus('verified');
                    })
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Errore durante la verifica:', error);
                setStatus('error');
            }
        };

        if (token) {
            verifyAccount();
        } else {
            setStatus('error');
        }
    }, [token]);

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen bg-gray-50">

            <div className="mx-auto flex w-full max-w-md flex-col space-y-6">
                {status === 'loading' && (
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="text-center mb-6">
                            <img
                                src="/img/logo.png"
                                alt="logo"
                                className="w-[200px] h-[200px] mx-auto"
                            />
                        </div>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                        <div className="font-semibold text-xl text-gray-700">
                            Verifica in corso...
                        </div>
                    </div>
                )}

                {status === 'verified' && (
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="text-center mb-6">
                            <img
                                src="/img/logo.png"
                                alt="logo"
                                className="w-[200px] h-[200px] mx-auto"
                            />
                        </div>
                        <div className="font-semibold text-3xl text-[#2d7044]">
                            Account verificato con successo!
                        </div>
                        <p className="text-gray-600">Ora puoi accedere alla tua area personale.</p>
                        <div className="text-center mt-6">
                            <button className="text-white bg-[#2d7044] hover:bg-[#2d7044] p-3 rounded-[15px] font-semibold">
                                <Link to="/login">Accedi</Link>
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <img
                            src="/img/emailVerifyError.png"
                            alt="errore"
                            className="w-24 h-24 mx-auto"
                        />
                        <div className="font-semibold text-3xl text-red-600">
                            Errore nella verifica
                        </div>
                        <p className="text-gray-600">Il link non è valido o è scaduto.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyAccountPage;
