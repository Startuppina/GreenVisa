import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MutatingDots } from 'react-loader-spinner'
import { useRecoveryContext } from './provider/provider';
import axiosInstance from './axiosInstance';

function PaySuccessPage() {
  const { setCartProducts, setQuantities, setIsEmpty } = useRecoveryContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const finalizePurchase = async () => {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        return;
      }

      try {
        await axiosInstance.post('/finalize-checkout-session', { sessionId });
        setCartProducts([]);
        setQuantities({});
        setIsEmpty(true);
      } catch (error) {
        console.error(error);
      }
    };

    finalizePurchase();

    const timer = setTimeout(() => {
      navigate('/user');
    }, 5000);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="text-arial">
      <div className="w-full min-h-screen flex flex-col items-center justify-center">
        <img src="/img/logo.png" alt="logo" className="w-[150px] h-[150px] md:w-[200px] md:h-[200px]" />
        <div className="flex items-center justify-center pt-8 px-4">
          <div className='flex flex-col items-center justify-center'>
            <h1 className="w-[90%] font-arial font-bold text-4xl text-center pb-3">
              Pagamento effettuato con successo!
            </h1>
            <div className='text-xl text-arial text-center w-1/2'>Nella pagina utente puoi accedere alla questionario relativo alla certificazione acquistata</div>
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
      </div>
    </div>
  );
}

export default PaySuccessPage
