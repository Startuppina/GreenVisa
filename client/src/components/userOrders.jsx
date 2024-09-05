import React, { useState, useEffect } from "react";
import axios from "axios";

function UserOrders() {
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {

            try {
                const response = await axios.get('http://localhost:8080/api/user-orders', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (Array.isArray(response.data)) {
                    setOrders(response.data);
                } else if (response.data.message) {
                    setMessage(response.data.message);
                } else {
                    setMessage("Non ci sono ordini qui");
                }
            } catch (error) {
                console.error(error);
                setMessage(error.response?.data?.msg || error.message);
            }
        };
        fetchOrders();
    }, []);

    return (
        <div className='h-[350px] bg-[#d9d9d9] p-4 rounded-lg mx-2 md:mx-14 overflow-x-auto mt-4'>
            <h2 className='text-2xl font-bold mb-4'>I tuoi ordini</h2>

            <div className="flex flex-wrap gap-4">
                {message ? (
                    <p>{message}</p>
                ) : (
                    orders.map((order) => (
                        <div key={order.order_id} >
                            <div className="p-4 w-full max-w-[700px] rounded-lg border-2 border-gray-400 z-10">
                                <h3 className="text-lg font-bold mb-4">Ordine {order.order_id}</h3>
                                <div className="flex flex-col md:flex-row text-center md:text-left items-center md:items-start mb-4">
                                    <img
                                        src={`http://localhost:8080/uploaded_img/${order.product_image}`}
                                        alt={order.product_name}
                                        className="w-full h-32 md:w-32 md:h-32 object-cover rounded-lg mb-4 md:mb-0 md:mr-4"
                                    />
                                    <div>
                                        <p className="text-xl font-semibold">{order.product_name}</p>
                                        <p className="text-gray-600">Data: {new Date(order.order_date).toLocaleDateString('en-CA')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row justify-between">
                                    <p className="mb-2"><span className="font-semibold">Quantità:</span> {order.quantity}</p>
                                    <p className="mb-2"><span className="font-semibold">Prezzo:</span> {order.price} €</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default UserOrders;
