import React from 'react'

const ConfirmAccountPageNoCompanyEmail = () => {
    return (
        <>
            <div className="flex flex-col justify-center items-center w-screen h-screen bg-gray-50">
                <div className="text-center mb-6">
                    <img
                        src="img/logo.png"
                        alt="logo"
                        className="w-[200px] h-[200px] mx-auto"
                    />
                </div>

                <div className="mx-auto flex w-full max-w-md flex-col space-y-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <div className="font-semibold text-3xl">
                            <p>L'email da te inserita non corrisponde alla dominio aziendale fornito dal sito web.
                                Verrai contattato telefonicamente per confermare il tuo account.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


export default ConfirmAccountPageNoCompanyEmail