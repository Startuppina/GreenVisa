import React, { useState } from 'react';

const CourseUploadForm = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);

    const handleTitleChange = (e) => setTitle(e.target.value);
    const handleDescriptionChange = (e) => setDescription(e.target.value);
    const handleImageChange = (e) => setImage(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !description || !image) {
            alert('Please fill out all fields.');
            return;
        }
    
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('image', image); // Assicurati che questa riga non sia commentata
    
        try {
            const response = await fetch('http://localhost:8080/api/news', { // Usa l'URL corretto
                method: 'POST',
                body: formData,
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid content-type: expected application/json');
            }
    
            const data = await response.json();
            console.log('News Data:', data);
            setTitle('');
            setDescription('');
            setImage(null);
        } catch (error) {
            console.error('Error:', error.message);
        }
    };
    

    return (
        <div className="w-[80%] mx-auto my-10 font-arial text-xl">
            <h2 className="text-3xl font-bold text-center mb-4">Pubblica una notizia</h2>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <label className="flex flex-col">
                    <span className="block mb-2">Titolo</span>
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                    />
                </label>
                <label className="flex flex-col">
                    <span className="block mb-2">Contenuto:</span>
                    <textarea
                        value={description}
                        onChange={handleDescriptionChange}
                        rows="4"
                        className="decoration-none bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                    />
                </label>
                <label className="flex flex-col">
                    <span className="block mb-2">Immagine</span>
                    <input
                        type="file"
                        onChange={handleImageChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                    />
                </label>
                <div className='flex justify-center'>
                    <button
                        type="submit"
                        className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                    >
                        Submit
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseUploadForm;
