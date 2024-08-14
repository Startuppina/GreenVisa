import React, { useState, useEffect } from 'react';

function QuantitySelector({ value, onValueChange }) {
    const [quantity, setQuantity] = useState(value);

    useEffect(() => {
        setQuantity(value);
    }, [value]);

    const handleIncrease = () => {
        if (quantity <= 99) {
            const newQuantity = quantity + 1;
            setQuantity(newQuantity);
            onValueChange(newQuantity); // Notifica il cambiamento al genitore
        }
    };

    const handleDecrease = () => {
        if (quantity > 1) {
            const newQuantity = quantity - 1;
            setQuantity(newQuantity);
            onValueChange(newQuantity); // Notifica il cambiamento al genitore
        }
    };

    return (
        <div className="flex items-center">
            <button
                onClick={handleDecrease}
                className="px-4 py-[0.32rem] bg-gray-300 text-gray-700 rounded-l text-2xl"
                aria-label="Decrease quantity"
            >
                -
            </button>
            <input
                type="text"
                value={quantity}
                readOnly
                className="w-12  py-[0.32rem] text-center border-t border-b border-gray-300 text-2xl"
                aria-label="Current quantity"
            />
            <button
                onClick={handleIncrease}
                className="px-4 py-[0.32rem] bg-gray-300 text-gray-700 rounded-r text-2xl"
                aria-label="Increase quantity"
            >
                +
            </button>
        </div>
    );
}

export default QuantitySelector;
