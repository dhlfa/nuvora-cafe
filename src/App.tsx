import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TableProvider } from './context/TableContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { Layout } from './components/Layout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { MenuPage } from './pages/MenuPage';
import { MenuDetailPage } from './pages/MenuDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <LocaleProvider>
          <TableProvider>
            <CartProvider>
              <HashRouter>
                <Layout>
                  <Routes>
                    {/* Landing / Scan Meja */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/order" element={<LandingPage />} />
                    
                    {/* Menu & Details */}
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/menu/:menuId" element={<MenuDetailPage />} />
                    
                    {/* Cart, Checkout & Payment processing */}
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    
                    {/* Live Order Status Tracking */}
                    <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
                    
                    {/* Customer Login / Register */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </HashRouter>
            </CartProvider>
          </TableProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

