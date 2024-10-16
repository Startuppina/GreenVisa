import React from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import PhoneInput from "react-phone-input-2";

function Contacts() {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [company_name, setCompany_name] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [subject, setSubject] = React.useState('');
    const [buttonPopup, setButtonPopup] = React.useState(false);
    const [messagePopup, setMessagePopup] = React.useState('');

    const handleNameChange = (event) => {
        setName(event.target.value);
    };
    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };
    const handleMessageChange = (event) => {
        setMessage(event.target.value);
    };
    const handleSubjectChange = (event) => {
        setSubject(event.target.value);
    };

    const handleCompanyNameChange = (event) => {
        setCompany_name(event.target.value);
    };

    const handlePhoneChange = (value) => {
        setPhone(value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Company Name:', company_name);
        console.log('Phone:', phone);
        console.log('Message:', message);
        console.log('Subject:', subject);

        const contactData = {
            name,
            email,
            company_name,
            phone,
            subject,
            message,
        };

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/send-message`, contactData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.status === 200) {
                setMessagePopup(response.data.msg);
                setButtonPopup(true);

                // Opzionalmente, puoi resettare i campi del modulo qui
                setName('');
                setEmail('');
                setCompany_name('');
                setMessage('');
                setSubject('');
            }
        } catch (error) {
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
            console.error('Error:', error);
        }
    };

    return (
        <>
            <div className="w-full min-h-screen md:bg-[url('/img/login.jpg')] bg-[#f6f3f3] bg-cover bg-center bg-no-repeat flex items-center justify-center md:p-8">
                <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                    {messagePopup}
                </MessagePopUp>
                <div className="p-6 bg-[#f6f3f3] md:bg-white w-full md:w-[80%] md:min-h-[60%] md:rounded-lg">
                    <h1 className="font-arial text-2xl md:text-3xl text-center font-bold mb-5">CONTATTACI VIA EMAIL</h1>
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="w-full md:w-[48%] p-4">
                            <form onSubmit={handleSubmit} className="w-full">
                                <div className='mb-5'>
                                    <label htmlFor="name" className='font-arial text-xl font-bold text-start block mb-2'>Nome e cognome</label>
                                    <input type="text" name="name" id="name" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5" value={name} onChange={handleNameChange} />
                                </div>
                                <div className='mb-5'>
                                    <label htmlFor="email" className='font-arial text-xl font-bold text-start block mb-2'>Email</label>
                                    <input type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5" value={email} onChange={handleEmailChange} />
                                </div>
                                <div className='mb-5'>
                                    <label htmlFor="company_name" className='font-arial text-xl font-bold text-start block mb-2'>Ragione sociale</label>
                                    <input type="company_name" name="company_name" id="company_name" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5" value={company_name} onChange={handleCompanyNameChange} />
                                </div>
                                <div className='mb-5'>
                                    <div className="w-full">
                                        <label htmlFor="phone" className="font-arial text-xl font-bold text-start block mb-2">Telefono</label>
                                        <PhoneInput
                                            country={'it'}
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            buttonClass="w-[45px] p-2 bg-gray-50"
                                            dropdownClass="w-full p-2 bg-gray-50"
                                            inputStyle={{ width: '100%', height: '42px', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                                            preferredCountries={['it']}
                                        />
                                    </div>
                                </div>
                                <div className='mb-5'>
                                    <label htmlFor="subject" className='font-arial text-xl font-bold text-start block mb-2'>Soggetto</label>
                                    <input type="text" name="subject" id="subject" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5" value={subject} onChange={handleSubjectChange} />
                                </div>
                                <div className='mb-5'>
                                    <label htmlFor="message" className='font-arial text-xl font-bold text-start block mb-2'>Messaggio</label>
                                    <textarea name="message" id="message" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 resize-none" value={message} onChange={handleMessageChange}></textarea>
                                </div>
                                <div className='flex justify-center'>
                                    <input type="submit" value="Invia" className="mt-7 font-arial font-semibold text-xl w-[70%] md:text-2xl md:w-[50%] lg:text-2xl lg:w-[30%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" />
                                </div>
                            </form>
                        </div>
                        <div className="w-full md:w-[48%] p-4 flex flex-col items-center">
                            <h1 className="font-arial text-2xl md:text-3xl text-center font-bold mb-5">Oppure chatta con noi</h1>
                            <img src="/img/whatsapp.png" alt="whatsapp" className="w-[200px] md:w-[250px] lg:w-[300px] m-auto hover:transform hover:scale-105 transition-transform duration-300" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Contacts;
