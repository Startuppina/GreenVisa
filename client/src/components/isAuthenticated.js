export async function isAuthenticated() {
    try {
        const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/authenticated`, {
            headers: {
                'Content-Type': 'application/json',  // Aggiungi l'Authorization header se il token esiste
            },
            withCredentials: true,
        });
        if (response.status === 200) {
            console.log("utente autenticato");
            return true;
        }
    }
    catch (error) {
        if (error.response && error.response.status === 401) {
            return; // se l'utente non ha il token ricevera 401 
            // ma diamo comunque la possibilita di accedere al carrello 
            // ma senza la sezione del codice promozionale                                    
        }
    }
}
