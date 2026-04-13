import { useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <Drawer anchor="right" open={isOpen} onClose={closeCart}>
      <Box sx={{ width: { xs: 320, sm: 380 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            Carrito ({totalItems})
          </Typography>
          <IconButton onClick={closeCart}><CloseIcon /></IconButton>
        </Box>

        {items.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'text.secondary' }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 64, opacity: 0.3 }} />
            <Typography>Tu carrito está vacío</Typography>
            <Button variant="outlined" onClick={closeCart}>Seguir comprando</Button>
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <Stack spacing={2}>
                {items.map(item => (
                  <Box key={item.product.id} sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar
                      src={item.product.main_image}
                      variant="rounded"
                      sx={{ width: 72, height: 72, flexShrink: 0 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>{item.product.name}</Typography>
                      <Typography variant="body2" color="primary" fontWeight={600}>
                        ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <IconButton size="small" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => removeItem(item.product.id)} sx={{ ml: 'auto' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Subtotal</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  ${subtotal.toLocaleString('es-AR')}
                </Typography>
              </Box>
              <Button fullWidth variant="contained" size="large" onClick={handleCheckout}>
                Ir al checkout
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
