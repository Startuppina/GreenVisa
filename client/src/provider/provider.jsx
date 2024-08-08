import React, { createContext, useState, useContext } from 'react';

// Crea il contesto
const RecoveryContext = createContext();

// Crea un provider per il contesto
export const RecoveryContextProvider = ({ children }) => {
    const [email, setEmail] = useState('');
    const [OTP, setOTP] = useState('');

    return (
        <RecoveryContext.Provider value={{ email, setEmail, OTP, setOTP }}>
            {children}
        </RecoveryContext.Provider>
    );
};

// Crea un hook personalizzato per consumare il contesto
export const useRecoveryContext = () => useContext(RecoveryContext);
