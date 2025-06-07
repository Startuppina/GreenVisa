import React, { useEffect } from 'react';

const AutosavePopup = ({ trigger }) => {
    return trigger ? (
        <div className='fixed bottom-4 left-4 p-4 w-auto rounded-lg bg-black bg-opacity-50 text-white z-50'>
            <div className="autosave-popup">
                <p>Salvataggio...</p>
            </div>
        </div>
    ) : null;
};


export default AutosavePopup;