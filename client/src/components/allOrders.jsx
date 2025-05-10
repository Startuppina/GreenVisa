import React, { useState, useEffect } from "react";
import axios from "axios";

function AllOrders() {
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/all-orders`, {
                    withCredentials: true
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
        <div className='w-full h-[430px] overflow-y-auto mx-auto font-arial text-xl rounded-2xl border shadow-xl px-5 py-6'>
            <h2 className='text-2xl font-bold mb-4'>Ordini degli Utenti</h2>

            <div className="flex flex-wrap gap-4">
                {message ? (
                    <p>{message}</p>
                ) : (
                    orders.map((order) =>
                        <div key={order.order_id}>
                            <div className="p-4 w-full md:w-[500px] rounded-lg border-2 bg-white shadow-lg">
                                <h3 className="text-lg font-bold mb-4">Ordine {order.order_id}</h3>
                                <div className="flex flex-col md:flex-row mb-4">
                                    <img
                                        src={`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/uploaded_img/${order.product_image}`}
                                        alt={order.product_name}
                                        className="w-full md:w-48 h-48 object-cover rounded-lg mb-4 md:mb-0 md:mr-4"
                                    />
                                    <div className="flex flex-col justify-between">
                                        <div>
                                            <p className="text-xl font-semibold mb-2">{order.product_name}</p>
                                            <p className="text-gray-600 mb-2">Data: {new Date(order.order_date).toLocaleDateString('ita')}</p>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-lg "><span className="font-semibold">Utente:</span> {order.username}</p>
                                            <p className="text-lg "><span className="font-semibold">Azienda:</span> {order.company_name}</p>
                                            <p className="text-lg "><span className="font-semibold">Telefono:</span> {order.phone_number !== null ? order.phone_number : "Non fornito"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-lg font-semibold"><span className="font-bold">Quantità:</span> {order.quantity}</p>
                                    <p className="text-lg font-semibold"><span className="font-bold">Prezzo:</span> {order.price} €</p>
                                </div>
                            </div>

                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default AllOrders;
