import React, { createContext, useState, useContext } from 'react';

// Crea il contesto
const RecoveryContext = createContext();

// Crea un provider per il contesto
export const RecoveryContextProvider = ({ children }) => {
    const [email, setEmail] = useState('');
    const [OTP, setOTP] = useState('');
    const [cartProducts, setCartProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [isEmpty, setIsEmpty] = useState(true);
    const [codeTrigger, setCodeTrigger] = useState(false);
    const [addBuildingTrigger, setAddBuildingTrigger] = useState(false);
    const [buildingID, setBuildingID] = useState(0);
    const [refresh, setRefresh] = useState(false);
    const [refreshResults, setRefreshResults] = useState(false);
    const [initialData, setInitialData] = useState(null); // Stato per i dati iniziali


    const triggerRefresh = () => setRefresh(prev => !prev);
    const triggerRefreshResults = () => setRefreshResults(prev => !prev);


    return (
        <RecoveryContext.Provider value={{
            email, setEmail, OTP, setOTP, cartProducts, setCartProducts,
            quantities, setQuantities, isEmpty, setIsEmpty, codeTrigger, setCodeTrigger,
            addBuildingTrigger, setAddBuildingTrigger, buildingID, setBuildingID, refresh,
            triggerRefresh, initialData, setInitialData, refreshResults, triggerRefreshResults
        }}>
            {children}
        </RecoveryContext.Provider>
    );
};

// Crea un hook personalizzato per consumare il contesto
export const useRecoveryContext = () => useContext(RecoveryContext);
