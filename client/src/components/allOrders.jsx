import React, { useState, useEffect } from "react";
import axios from "axios";

function AllOrders() {
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/all-orders', {
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
        <div className='w-[98.5%] h-[400px] overflow-y-auto mx-auto my-10 font-arial text-xl m-4 rounded-2xl border shadow-xl px-10 py-6'>
            <h2 className='text-2xl font-bold mb-4'>Ordini degli Utenti</h2>

            <div className="flex flex-wrap gap-4">
                {message ? (
                    <p>{message}</p>
                ) : (
                    orders.map((order) =>
                        <>
                            <div key={order.order_id} className=" p-4 w-full md:w-[500px] rounded-lg border-2">
                                <h3 className="text-lg font-bold mb-4">Ordine {order.order_id}</h3>
                                <div className="flex items-center mb-4">
                                    <img
                                        src={`http://localhost:8080/uploaded_img/${order.product_image}`}
                                        alt={order.product_name}
                                        className="w-32 h-32 object-cover rounded-lg mr-4"
                                    />
                                    <div>
                                        <p className="text-xl font-semibold">{order.product_name}</p>
                                        <p className="text-gray-600"><p className="text-gray-600">Data: {new Date(order.order_date).toLocaleDateString('en-CA')}</p></p>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <p className="mb-2"><span className="font-semibold">Quantità:</span> {order.quantity}</p>
                                    <p className="mb-2"><span className="font-semibold">Prezzo:</span> {order.price} €</p>
                                </div>
                            </div>
                            <hr className="my-4 border-1 border-black" />

                        </>
                    )
                )}
            </div>
        </div>
    );
}

export default AllOrders;
