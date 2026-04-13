import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import StoreNavbar from './StoreNavbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

export default function StoreLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <StoreNavbar />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
      <CartDrawer />
    </Box>
  );
}
