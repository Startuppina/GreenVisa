import React, { useState, useEffect } from 'react'
import MessagePopUp from './messagePopUp'
import axios from 'axios'
import { MutatingDots } from 'react-loader-spinner'
import { useNavigate } from 'react-router-dom'
import { useRecoveryContext } from '../provider/provider'

function PromoCodeForm() {
    const [code, setCode] = useState('');
    const [discount, setDiscount] = useState('');
    const [start, setStart] = useState('');
    const [expiration, setExpiration] = useState('');
    const [category, setCategory] = useState('');

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [categories, setCategories] = useState([]);

    const handleCodeChange = (e) => setCode(e.target.value);
    const handleDiscountChange = (e) => setDiscount(e.target.value);
    const handleStartChange = (e) => setStart(e.target.value);
    const handleExpirationChange = (e) => setExpiration(e.target.value);
    const handleCategoryChange = (e) => setCategory(e.target.value);

    const { codeTrigger, setCodeTrigger } = useRecoveryContext();

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/categories`);
                const data = response.data
                setCategories(["Tutti", ...data]);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories(['Category 1', 'Category 2', 'Category 3']);
            }
        };

        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        ;

        setIsLoading(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/create-promo-code`, { code, discount, start, expiration, category }, {
                withCredentials: true,
            });

            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopUp(response.data.msg);
                    setButtonPopup(true);
                    setIsLoading(false);
                    setCodeTrigger(!codeTrigger);
                    setCode('');
                    setDiscount('');
                    setStart('');
                    setExpiration('');
                    setCategory('');
                }, 3000);

                navigate('/User');

            }

        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
            setIsLoading(false);
        }
    }
    return (
        <div className="w-full mx-auto font-arial text-xl rounded-2xl border shadow-xl px-10 py-6">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <h2 className="text-2xl font-bold text-center mb-4">Aggiungi un codice promozionale</h2>
            <form onSubmit={handleSubmit} className="flex flex-col ">
                <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Codice Promozionale</span>
                        <input
                            type="text"
                            value={code}
                            onChange={handleCodeChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        />
                    </label>
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Sconto percentuale</span>
                        <select
                            value={discount}
                            onChange={handleDiscountChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        >
                            <option value="">Seleziona una percentuale</option>
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                            <option value="20">20%</option>
                            <option value="25">25%</option>
                            <option value="30">30%</option>
                            <option value="35">35%</option>
                            <option value="40">40%</option>
                            <option value="45">45%</option>
                            <option value="50">50%</option>
                            <option value="60">60%</option>
                            <option value="70">70%</option>
                            <option value="80">80%</option>
                            <option value="90">90%</option>
                            <option value="100">100%</option>
                        </select>
                    </label>
                </div>
                <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Data d'inizio</span>
                        <input
                            type="date"
                            value={start}
                            onChange={handleStartChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        />
                    </label>
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Data di scadenza</span>
                        <input
                            type="date"
                            value={expiration}
                            onChange={handleExpirationChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        />
                    </label>
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Categoria di utilizzo</span>
                        <select
                            value={category}
                            onChange={handleCategoryChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        >
                            <option value="" disabled>Seleziona una categoria</option>
                            {categories.map((cat, index) => (
                                <option key={index} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className='flex justify-center'>
                    {isLoading ? (
                        <div className="flex justify-center items-center mt-5">
                            <MutatingDots
                                height="100"
                                width="100"
                                color="#2d7044"
                                secondaryColor='#2d7044'
                                radius='12.5'
                                ariaLabel="mutating-dots-loading"
                                visible={true}
                            />
                        </div>
                    ) : (
                        <button
                            type="submit"
                            className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        >
                            Carica
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}

export default PromoCodeForm