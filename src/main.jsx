import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import BookingPage from './components/BookingPage.jsx'
import AdminApp from './components/AdminApp.jsx'
import './index.css'

const path = window.location.pathname
const bookingMatch = path.match(/^\/book\/([a-z0-9-]+)\/?$/)
const isAdmin = path === '/admin' || path === '/admin/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminApp /> : bookingMatch ? <BookingPage slug={bookingMatch[1]} /> : <App />}
  </React.StrictMode>
)
