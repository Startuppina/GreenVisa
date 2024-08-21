import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MutatingDots } from 'react-loader-spinner'
import { useRecoveryContext } from './provider/provider';
import axios from 'axios';

function PaySuccessPage() {
  const { setCartProducts, setQuantities, setIsEmpty } = useRecoveryContext();
  const navigate = useNavigate();

  useEffect(() => {

    const remove_user_cart = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.delete('http://localhost:8080/api/remove-user-cart', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.status === 200) {
          console.log(response.data);
          setCartProducts([]);
          setQuantities({});
          setIsEmpty(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    //setCodeUsageTrue();
    remove_user_cart();

    const timer = setTimeout(() => {
      navigate('/Carrello');
    }, 5000);
    return () => {
      clearTimeout(timer);
    }
  }, []);

  const returnToLogin = () => {
    navigate('/Carrello');
  };

  return (
    <div className="text-arial">
      <div className="w-full min-h-screen flex flex-col items-center justify-center">
        <img src="/img/logo.png" alt="logo" className="w-[150px] h-[150px] md:w-[200px] md:h-[200px]" />
        <div className="flex items-center justify-center pt-8 px-4">
          <div className='flex flex-col items-center justify-center'>
            <h1 className="w-[90%] font-arial font-bold text-4xl text-center pb-3">
              Pagamento Effettuato con successo!
            </h1>
            <div className='text-xl text-arial text-center'>Verrai reindirizzato al questionario per il calcolo delle emissioni</div>
            <MutatingDots
              visible={true}
              height="100"
              width="100"
              color="#2d7044"
              secondaryColor="#2d7044"
              radius="12.5"
              ariaLabel="mutating-dots-loading"
              wrapperStyle={{}}
              wrapperClass=""
              />
          </div>
        </div>
        <div className="w-full flex items-center justify-center p-8">
          <button
            className="font-bold w-auto flex justify-center items-center border-2 border-transparent rounded-xl py-4 bg-[#2d7044] text-white hover:bg-white hover:text-[#2d7044] hover:border-[#2d7044] transition-colors duration-300 ease-in-out text-xl"
            onClick={returnToLogin}
          >
            Torna a carrello
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaySuccessPage