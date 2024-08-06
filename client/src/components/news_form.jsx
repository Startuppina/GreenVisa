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
        <div className="w-[80%] mx-auto my-10">
            <h2 className="text-2xl font-bold text-center mb-4">Upload News</h2>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <label className="flex flex-col">
                    <span className="font-bold mb-2">Title:</span>
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        className="border rounded-lg p-2"
                    />
                </label>
                <label className="flex flex-col">
                    <span className="font-bold mb-2">Description:</span>
                    <textarea
                        value={description}
                        onChange={handleDescriptionChange}
                        rows="4"
                        className="border rounded-lg p-2"
                    />
                </label>
                <label className="flex flex-col">
                    <span className="font-bold mb-2">Image:</span>
                    <input
                        type="file"
                        onChange={handleImageChange}
                        className="border rounded-lg p-2"
                    />
                </label>
                <button
                    type="submit"
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                >
                    Submit
                </button>
            </form>
        </div>
    );
};

export default CourseUploadForm;
