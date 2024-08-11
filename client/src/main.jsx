import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
//import './index.css'
import {createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from './LoginPage.jsx';
import NewsPage from './NewsPage.jsx';
import SignUpPage from './SignUpPage.jsx';
import ArticlePage from './ArticlePage.jsx';
import ContactsPage from './ContactsPage.jsx';
import PrivacyPage from './PrivacyPage.jsx';
import EntryPage from './EntryPage.jsx';
import ProductPage from './ProductPage.jsx';
import CarrelloPage from './CarrelloPage.jsx';
import PaymentPage from './paymentPage.jsx';
import UserPage from './UserPage.jsx';
import OTPInput from './components/OTPInput.jsx';
import Reset from './components/reset.jsx';
import Recovered from './components/recovered.jsx';
import InsertEmail from './components/insertEmail.jsx';
import { RecoveryContextProvider } from './provider/provider.jsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/Login",
    element: <LoginPage />,
  },
  {
    path: "/News",
    element: <NewsPage />,
  },
  {
    path: "/Signup",
    element: <SignUpPage />,
  },
  {
    path: "/Article/:id",
    element: <ArticlePage />,
  },
  {
    path: "/Contacts",
    element: <ContactsPage />,
  },
  {
    path: "/Privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/Products",
    element: <EntryPage />,
  },
  {
    path: "/ProductDetails",
    element: <ProductPage />,
  },
  {
    path: "/Carrello",
    element: <CarrelloPage />,
  },
  {
    path: "/payment",
    element: <PaymentPage />, 
  },
  {
    path: "/User",
    element: <UserPage />,
  },
  {
    path: "/InsertEmail",
    element: <InsertEmail />,
  },
  {
    path: "/Verification",
    element: <OTPInput />,
  },
  {
    path: "/Reset",
    element: <Reset />,
  },
  {
    path: "/Recovered",
    element: <Recovered />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RecoveryContextProvider>
      <RouterProvider router={router} />
    </RecoveryContextProvider>
  </React.StrictMode>,
)
