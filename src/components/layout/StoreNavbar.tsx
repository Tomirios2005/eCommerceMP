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

export default function StoreNavbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems, openCart } = useCart();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    navigate('/');
  };

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
                {profile?.avatar_url ? (
                  <Avatar src={profile.avatar_url} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{profile?.full_name || 'Usuario'}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { handleMenuClose(); navigate('/orders'); }}>
                  <ReceiptLongIcon fontSize="small" sx={{ mr: 1 }} />
                  Mis Pedidos
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
