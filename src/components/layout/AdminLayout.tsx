import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { label: 'Productos', icon: <InventoryIcon />, path: '/admin/products' },
  { label: 'Pedidos', icon: <ShoppingBagIcon />, path: '/admin/orders' },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0d1b2e' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: 1.5, display: 'flex' }}>
          <StorefrontIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="white">Admin Panel</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {import.meta.env.VITE_APP_NAME || 'MiTienda'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 1.5,
                  color: active ? 'white' : 'rgba(255,255,255,0.6)',
                  bgcolor: active ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: active ? 'primary.dark' : 'rgba(255,255,255,0.05)', color: 'white' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
            {profile?.full_name?.[0] || 'A'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="white" noWrap display="block">
              {profile?.full_name || 'Admin'}
            </Typography>
            <Chip label="Admin" size="small" color="secondary" sx={{ height: 16, fontSize: 10 }} />
          </Box>
        </Box>
        <ListItemButton onClick={() => navigate('/')} sx={{ borderRadius: 1.5, color: 'rgba(255,255,255,0.6)', py: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' } }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><StorefrontIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Ver tienda" primaryTypographyProps={{ fontSize: 13 }} />
        </ListItemButton>
        <ListItemButton onClick={handleSignOut} sx={{ borderRadius: 1.5, color: 'rgba(255,255,255,0.6)', py: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'error.light' } }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Cerrar sesión" primaryTypographyProps={{ fontSize: 13 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile ? (
        <>
          <AppBar position="fixed" color="primary">
            <Toolbar>
              <IconButton color="inherit" onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>
              <Typography variant="h6" fontWeight={700} sx={{ ml: 1 }}>Admin</Typography>
            </Toolbar>
          </AppBar>
          <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
            {drawer}
          </Drawer>
        </>
      ) : (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawer}
        </Drawer>
      )}

      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, mt: isMobile ? 8 : 0, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
