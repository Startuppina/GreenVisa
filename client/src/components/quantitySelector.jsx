import React from "react";
import { useState, useEffect } from "react";

function QuantitySelector() {
    const [quantity, setQuantity] = useState(1);
    
    useEffect(() => {
        if (quantity > 99) {
            setQuantity(99);
        }
    }, [quantity] /*quantity is a dependency, the effect is executed when quantity changes*/); 

    function decrementQuantity() {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    }

    function incrementQuantity() {
        setQuantity(quantity + 1);
    }

    function handleChange(event) {
        const value = parseInt(event.target.value, 10); //convert the value in a number. Input type text is always a string
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
                onBlur={handleBlur} // handleBlur() is called when the input loses focus to input. The user remove pointer to the input area
                className="w-[30%] text-center cursor-pointer"
            />
            <button onClick={incrementQuantity} className="cursor-pointer">+</button>
        </div>
    );
}

export default QuantitySelector;