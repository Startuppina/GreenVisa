import React, { useState } from 'react';
import TextEditor from './textEditor';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MessagePopUp from './messagePopUp';



const NewsForm = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const navigate = useNavigate();

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");

    //const [value, setValue] = useState(''); // Per ReactQuill

    const handleTitleChange = (e) => setTitle(e.target.value);
    const handleContentChange = (value) => setContent(value);
    const handleImageChange = (e) => setImage(e.target.files[0]);

    const sanitizeContent = (html) => { // removes all HTML tags from content
        const div = document.createElement('div');
        div.innerHTML = html;
        const text = div.textContent || div.innerText || '';
        return text.trim();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const sanitizedContent = sanitizeContent(content);

        if (!title || sanitizedContent === '' || !image) {
            setMessagePopUp("Compila tutti i campi");
            setButtonPopup(true);
            return;
        }

        console.log('Title:', title);
        console.log('Content:', content);
        console.log('Image:', image);

        const token = localStorage.getItem('token');
        if (!token) {
            setMessagePopUp("Per favore effettua il login");
            setButtonPopup(true);
            return;
        }
    
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('image', image); // Assicurati che questa riga non sia commentata

        console.log('FormData:', formData);
    
        try {
            const response = await axios.post('http://localhost:8080/api/upload-news', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.status == 200) {
                setMessagePopUp(response.data.msg);
                setButtonPopup(true);
                navigate("/User");
            }
    
            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid content-type: expected application/json');
            }
    
            setTitle('');
            setContent('');
            setImage(null);
        } catch (error) {
            setMessagePopUp(`Errore durante la pubblicazione della notizia: ${error.message}`);
            setButtonPopup(true);
        }
    };
    

    return (
        <div className="w-[98.5%] mx-auto my-10 font-arial text-xl m-4 rounded-2xl border shadow-xl px-10 py-6">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <h2 className="text-2xl font-bold text-center mb-4">Pubblica una notizia</h2>
            <form onSubmit={handleSubmit} className="flex flex-col ">
                <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                    <label className="flex flex-col w-full">
                        <span className="block mb-2">Titolo</span>
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                        />
                    </label>
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
                {<label className="flex flex-col w-full z-10">
                    <span className="block mb-2">Contenuto:</span>
                    <TextEditor theme="snow" value={content} onChange={handleContentChange}/>
                </label>}
                <div className='flex justify-center'>
                    <button
                        type="submit"
                        className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                    >
                        Carica
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewsForm;
