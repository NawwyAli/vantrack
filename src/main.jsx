import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import BookingPage from './components/BookingPage.jsx'
import './index.css'

const bookingMatch = window.location.pathname.match(/^\/book\/([a-z0-9-]+)\/?$/)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {bookingMatch ? <BookingPage slug={bookingMatch[1]} /> : <App />}
  </React.StrictMode>
)
