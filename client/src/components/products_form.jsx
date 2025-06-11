import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MessagePopUp from './messagePopUp';
import { MutatingDots } from 'react-loader-spinner';

function ProductsForm() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);
    const [info, setInfo] = useState('');
    const [cod, setCod] = useState('');
    const [category, setCategory] = useState('');
    const [tag, setTag] = useState('');
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // Stato per gestire il caricamento
    const navigate = useNavigate();

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/categories`);
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories(['Category 1', 'Category 2', 'Category 3']);
            }
        };

        fetchCategories();
    }, []);

    const handleTitleChange = (e) => setName(e.target.value);
    //const handlePriceChange = (e) => setPrice(e.target.value);
    const handleImageChange = (e) => setImage(e.target.files[0]);
    const handleInfoChange = (e) => setInfo(e.target.value);
    const handleCodeChange = (e) => setCod(e.target.value);
    const handleCategoryChange = (e) => setCategory(e.target.value);
    const handleTagChange = (e) => setTag(e.target.value);


    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);

        ;

        const formData = new FormData();
        formData.append('name', name);
        //formData.append('price', price);
        formData.append('image', image);
        formData.append('info', info);
        formData.append('cod', cod);
        formData.append('category', category);
        formData.append('tag', tag);

        console.log('Form data:', formData);

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/upload-product`, formData, {
                withCredentials: true,
            });

            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopup(response.data.msg);
                    setButtonPopup(true);
                    setIsLoading(false);
                    setName('');
                    //setPrice('');
                    setImage(null);
                    setInfo('');
                    setCod('');
                    setCategory('');
                    setTag('');
                }, 3000); // Caricamento finto di 2 secondi

                navigate("/User");
            } else if (response.status === 400) {
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    return (
        <div className="w-full mx-auto m-4 rounded-2xl font-arial text-xl px-10 py-6  border-gray-300 shadow-xl">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <h2 className="text-2xl font-bold text-center mb-4">Aggiungi una nuova certificazione</h2>
            <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Titolo</span>
                        <input
                            type="text"
                            value={name}
                            onChange={handleTitleChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        />
                    </label>
                    {/*
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Prezzo (base 350 euro)</span>
                        <input
                            type="text"
                            value={price}
                            //onChange={handlePriceChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        />
                    </label> */}
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Immagine</span>
                        <input
                            type="file"
                            onChange={handleImageChange}
                            name='image'
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 z-10"
                        />
                    </label>
                </div>
                <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Codice</span>
                        <input
                            type="text"
                            value={cod}
                            onChange={handleCodeChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        />
                    </label>
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Tag</span>
                        <input
                            type="text"
                            value={tag}
                            onChange={handleTagChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        />
                    </label>
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Categoria</span>
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
                <div className="flex flex-col mb-4">
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Info</span>
                        <textarea
                            value={info}
                            onChange={handleInfoChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 z-10 h-[150px]"
                        />
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
    );
}

export default ProductsForm;
