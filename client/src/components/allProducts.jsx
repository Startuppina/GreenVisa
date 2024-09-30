import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import ConfirmPopUp from "./confirmPopUp";
import { useRecoveryContext } from "../provider/provider";

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

function AllProducts() {
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [categories, setCategories] = useState([]);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [messageConfirm, setMessageConfirm] = useState("");
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [currentProductToEdit, setCurrentProductToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // Stato per il termine di ricerca
    const [filteredProducts, setFilteredProducts] = useState([]); // Stato per gli utenti filtrati
    const { refresh, triggerRefresh } = useRecoveryContext();

    const formRef = useRef(null);
    useEffect(() => {
        if (currentProductToEdit && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [currentProductToEdit, itemToEdit]);


    useEffect(() => {
        const fetchProducts = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get(
                    "http://localhost:8080/api/products-info",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (response.status === 200) {
                    setProducts(response.data.products || []);
                    setFilteredProducts(response.data.products || [])
                    setTotalProducts(response.data.products?.length || 0);
                }
            } catch (error) {
                //setMessagePopUp("Errore durante il recupero delle certificazioni");
                //setButtonPopup(true);
            }
        };

        fetchProducts();
    }, [refresh]); // No dependencies

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:8080/api/categories"
                );
                if (response.status === 200) {
                    setCategories(response.data);
                }
            } catch (error) {
                setMessagePopUp("Errore durante il recupero delle categorie");
                setButtonPopup(true);
            }
        };

        fetchCategories();
    }, []); // No dependencies

    const deleteItem = async () => {
        setPopupConfirmDelete(false);
        if (!itemToDelete) return;

        const { id } = itemToDelete;
        const token = localStorage.getItem("token");

        try {
            const response = await axios.delete(
                `http://localhost:8080/api/delete-product/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {

                setProducts((prevProducts) =>
                    prevProducts.filter((product) => product.id !== id)
                );
                setTotalProducts((prevTotalProducts) => prevTotalProducts - 1);
                setMessagePopUp("Certificazione eliminata con successo");
                setButtonPopup(true);

            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const handleEdit = (item) => {
        console.log("item to edit", item);
        setItemToEdit({ ...item });
    };

    const saveEdit = async () => {
        if (!itemToEdit) return;

        const { id, ...editedData } = itemToEdit;
        const elements = { id, ...editedData };
        console.log(elements);
        const token = localStorage.getItem("token");

        try {
            const formData = new FormData();
            for (const key in elements) {
                if (elements[key] instanceof File) {
                    formData.append(key, elements[key]);
                } else {
                    formData.append(key, elements[key]);
                }
            }

            const response = await axios.put(
                `http://localhost:8080/api/edit-product/${id}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                const updatedItem = response.data.tuple;
                console.log("ciao", updatedItem);

                setProducts((prevProducts) =>
                    prevProducts.map((product) =>
                        product.id === updatedItem.id ? updatedItem : product
                    )

                );
                triggerRefresh();
                setMessagePopUp("Certificazione modificata con successo");
                setButtonPopup(true);
                setItemToEdit(null);
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItemToEdit((prevItem) => ({ ...prevItem, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setItemToEdit((prevItem) => ({ ...prevItem, [name]: files[0] }));
    };

    const cancelEdit = () => {
        setCurrentProductToEdit(null);
    };

    const handleSearchChange = debounce((searchTerm) => {
        setFilteredProducts(products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }, 300);

    return (
        <div className="w-full mb-8 border rounded-2xl shadow-lg p-4 h-[100vh] overflow-y-auto">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteItem}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <h2 className="text-2xl font-bold mb-4">
                Certificazioni ({totalProducts}{" "}
                {totalProducts === 1 ? "certificazione" : "certificazioni"})
            </h2>
            {totalProducts > 0 && (
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Cerca per nome"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            handleSearchChange(e.target.value); // Chiama la funzione di ricerca
                        }}
                        className="w-full md:w-[400px] p-2 border border-gray-300 rounded-lg mb-10"
                    />
                </div>
            )}

            {filteredProducts.length === 0 ? (
                <p className="text-center text-gray-500">Nessuna certificazione trovata</p>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredProducts.map((productItem, index) => (
                        <div
                            key={index}
                            className="border rounded-lg p-4 shadow-lg bg-white mb-8"
                        >
                            <div className="flex flex-col md:flex-row md:gap-20 items-center">
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-bold mb-2">
                                        Nome: {productItem.name}
                                    </h3>
                                    <div className="mb-2 w-[150px] h-[150px]">
                                        <img
                                            src={`http://localhost:8080/uploaded_img/${productItem.image}`}
                                            alt={productItem.name}
                                            className=" object-cover rounded mb-2"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="mb-2 flex gap-2">
                                        <label className="block text-gray-600 mb-1">
                                            Prezzo:
                                        </label>
                                        <p>{productItem.price} €</p>
                                    </div>
                                    <div className="mb-2 flex gap-2">
                                        <label className="block text-gray-600 mb-1">
                                            Codice:
                                        </label>
                                        <p>{productItem.cod}</p>
                                    </div>
                                    <div className="mb-2 flex gap-2">
                                        <label className="block text-gray-600 mb-1">Tag:</label>
                                        <p>{productItem.tag}</p>
                                    </div>
                                    <div className="mb-2 flex gap-2">
                                        <label className="block text-gray-600 mb-1">
                                            Categoria:
                                        </label>
                                        <p>{productItem.category}</p>
                                    </div>
                                    <div className="mb-2 flex gap-2">
                                        <label className="block text-gray-600 mb-1">
                                            Info:
                                        </label>
                                        <p>{productItem.info}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <>
                                    <button
                                        onClick={() => {
                                            handleEdit(productItem)
                                            setCurrentProductToEdit(currentProductToEdit === productItem.id ? null : productItem.id)
                                        }}
                                        className="bg-[#2d7044] text-white px-4 py-2 rounded-lg hover:text-[#2d7044] hover:bg-white border-2 border-[#2d7044] transition-colors duration-300 ease-in-out"
                                    >
                                        Modifica
                                    </button>
                                    <button
                                        onClick={() => {
                                            setItemToDelete({
                                                id: productItem.id,
                                            });
                                            setMessageConfirm(
                                                "Sei sicuro di voler eliminare questa certificazione?"
                                            );
                                            setPopupConfirmDelete(true);
                                        }}
                                        className="z-20 bg-red-500 text-white px-4 py-2 rounded-lg border-2 border-red-500 hover:text-red-500 hover:bg-white transition-colors duration-300 ease-in-out"
                                    >
                                        Elimina
                                    </button>
                                </>
                            </div>
                            {currentProductToEdit === productItem.id && itemToEdit && (
                                <div className="w-[98.5%] mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border border-gray-300 shadow-xl" ref={formRef}>
                                    <h2 className="text-2xl font-bold text-center mb-4">
                                        Modifica Certificazione
                                    </h2>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            saveEdit();
                                        }}
                                        className="flex flex-col"
                                    >
                                        <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Titolo</span>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={itemToEdit.name || ""}
                                                    onChange={handleChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                                                />
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Prezzo</span>
                                                <input
                                                    type="text"
                                                    name="price"
                                                    value={itemToEdit.price || ""}
                                                    onChange={handleChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                                                />
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Immagine</span>
                                                <input
                                                    type="file"
                                                    name="image"
                                                    onChange={handleFileChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 z-10"
                                                />
                                            </label>
                                        </div>
                                        <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Codice</span>
                                                <input
                                                    type="text"
                                                    name="cod"
                                                    value={itemToEdit.cod || ""}
                                                    onChange={handleChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                                                />
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Tag</span>
                                                <input
                                                    type="text"
                                                    name="tag"
                                                    value={itemToEdit.tag || ""}
                                                    onChange={handleChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                                                />
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Categoria</span>
                                                <select
                                                    name="category"
                                                    value={itemToEdit.category || ""}
                                                    onChange={handleChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                                                >
                                                    <option value="" disabled>
                                                        Seleziona una categoria
                                                    </option>
                                                    {categories.map((cat, index) => (
                                                        <option key={index} value={cat}>
                                                            {cat}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                        <div className="flex flex-col mb-4">
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Info</span>
                                                <textarea
                                                    name="info"
                                                    value={itemToEdit.info || ""}
                                                    onChange={handleChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 z-10 h-[150px]"
                                                />
                                            </label>
                                        </div>
                                        <div className="flex justify-center gap-3">
                                            <button
                                                type="submit"
                                                onClick={() => {
                                                    // Imposta l'item da modificare
                                                    setItemToEdit((prevItem) => ({
                                                        ...prevItem,
                                                        id: productItem.id
                                                    }));

                                                    // Chiama la funzione saveEdit
                                                    saveEdit();
                                                }}
                                                className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                            >
                                                Salva
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-gray-500 text-white rounded-lg border-2 border-transparent hover:border-gray-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-gray-500"
                                            >
                                                Annulla
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AllProducts 