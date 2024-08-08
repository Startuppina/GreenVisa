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
    path: "/Article",
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
    path: "/OTP",
    element: <OTPInput />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
