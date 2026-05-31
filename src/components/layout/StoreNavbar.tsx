import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { arePendingOrders } from '../../services/orderService';
import { useEffect } from 'react';
export default function StoreNavbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems, openCart } = useCart();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hayPedidosPendientes, setHayPedidosPendientes] = useState(false); // Estado para controlar si hay pedidos pendientes
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    navigate('/');
  };
  const updatePendingOrdersStatus = async () => {
    if (user) {
      const pendientes = await arePendingOrders(user.id);
      setHayPedidosPendientes(pendientes);
    }
  };
  useEffect(() => {
    updatePendingOrdersStatus();
    const interval = setInterval(updatePendingOrdersStatus, 10000); // Verifica cada 10 segundos
    return () => clearInterval(interval); // Limpia el intervalo al desmontar el componente
  }, [user]); // Se ejecuta cada vez que cambia el usuario (login/logout) para actualizar el estado de pedidos pendientes
  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
          <StorefrontIcon />
          <Typography variant="h6" fontWeight={700} sx={{ display: { xs: 'none', sm: 'block' } }}>
            {import.meta.env.VITE_APP_NAME || 'MiTienda'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={openCart}>
            <Badge badgeContent={totalItems} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>

          {user ? (
            <>
              <IconButton onClick={handleMenuOpen} color="inherit">
                <Badge
                  badgeContent="!"
                  color="error" // Hace que la burbuja sea roja (puedes usar "warning" para amarillo/naranja)
                  invisible={!hayPedidosPendientes} // Se oculta si NO hay pedidos pendientes
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      height: 16,
                      minWidth: 16,
                      padding: '0 4px',
                    }
                  }}
                >
                  {profile?.avatar_url ? (
                    <Avatar src={profile.avatar_url} sx={{ width: 32, height: 32 }} />
                  ) : (
                    <AccountCircleIcon />
                  )}
                </Badge>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{profile?.full_name || 'Usuario'}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
               <MenuItem 
  onClick={() => { handleMenuClose(); navigate('/orders'); }}
  sx={{ justifyContent: 'space-between' }} // Alinea el badge a la derecha si lo deseas
>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <ReceiptLongIcon fontSize="small" sx={{ mr: 1 }} />
    Mis Pedidos
  </Box>
  
  {/* Si hay pedidos, muestra el círculo rojo indicador */}
  {hayPedidosPendientes && (
    <Box 
      sx={{ 
        width: 8, 
        height: 8, 
        backgroundColor: 'error.main', 
        borderRadius: '50%',
        marginLeft: 2 
      }} 
    />
  )}
</MenuItem>
                {isAdmin && (
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/admin'); }}>
                    <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} />
                    Administración
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleSignOut}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Cerrar Sesión
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button component={RouterLink} to="/login" color="inherit" variant="outlined" size="small" sx={{ borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff' } }}>
              Ingresar
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
