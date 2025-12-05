import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Cart from './pages/Cart'
import OrderSuccess from './pages/OrderSuccess'
import MerchantProducts from './pages/MerchantProducts'
import MerchantProductForm from './pages/MerchantProductForm'
import AdminDashboard from './pages/AdminDashboard'
import './index.css'
import { ToastProvider } from './components/Toast'

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<ProductList/>} />
        <Route path='/products/:id' element={<ProductDetail/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/register' element={<Register/>} />
        <Route path='/cart' element={<Cart/>} />
        <Route path='/orders/:id' element={<OrderSuccess/>} />

        <Route path='/merchant/products' element={<MerchantProducts/>} />
        <Route path='/merchant/products/new' element={<MerchantProductForm/>} />
        <Route path='/merchant/products/:id/edit' element={<MerchantProductForm/>} />

        <Route path='/admin' element={<AdminDashboard/>} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
)
