import React, { useState, useEffect } from "react";

function QuantitySelector({ onValueChange }) {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        // Verifica che onValueChange sia una funzione prima di chiamarla
        if (typeof onValueChange === 'function') {
            onValueChange(quantity);
        }

        // Restrizione: quantità non deve superare 99
        if (quantity > 99) {
            setQuantity(99);
        }
    }, [quantity, onValueChange]); // Assicurati che onValueChange sia incluso nelle dipendenze

    function decrementQuantity() {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    }

    function incrementQuantity() {
        if (quantity < 99) {
            setQuantity(quantity + 1);
        }
    }

    function handleChange(event) {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= 99) {
            setQuantity(value);
        } else if (event.target.value === '') {
            setQuantity('');
        }
    }

    function handleBlur() {
        if (quantity === '') {
            setQuantity(1);
        }
    }

    return (
        <div className="text-arial text-xl flex gap-10 bg-white rounded-lg p-1 w-[150px] z-9999">
            <button onClick={decrementQuantity} className="cursor-pointer">-</button>
            <input
                type="text"
                value={quantity}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-[30%] text-center cursor-pointer"
            />
            <button onClick={incrementQuantity} className="cursor-pointer">+</button>
        </div>
    );
}

export default QuantitySelector;
