import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import StoreLayout from './components/layout/StoreLayout';
import AdminLayout from './components/layout/AdminLayout';
import HomePage from './pages/store/HomePage';
import ProductDetailPage from './pages/store/ProductDetailPage';
import CheckoutPage from './pages/store/CheckoutPage';
import OrdersPage from './pages/store/OrdersPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/admin/DashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<StoreLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/checkout" element={
                  <ProtectedRoute><CheckoutPage /></ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute><OrdersPage /></ProtectedRoute>
                } />
              </Route>

              <Route path="/admin" element={
                <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>
              }>
                <Route index element={<DashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="products/new" element={<ProductFormPage />} />
                <Route path="products/:id/edit" element={<ProductFormPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
