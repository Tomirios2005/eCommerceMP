import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import type { Product } from '../../lib/types';
import { useCart } from '../../context/CartContext';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
      <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/products/${product.slug}`)}>
        <CardMedia
          component="img"
          height={220}
          image={product.main_image || 'https://via.placeholder.com/400x220?text=Sin+imagen'}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
        />
        {discount && (
          <Chip
            label={`-${discount}%`}
            color="secondary"
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 700 }}
          />
        )}
        {product.stock === 0 && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chip label="Sin stock" color="error" />
          </Box>
        )}
      </Box>
      <CardContent sx={{ flex: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: 12 }}>
          {product.category?.name}
        </Typography>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' }, lineHeight: 1.3, mb: 1 }}
          onClick={() => navigate(`/products/${product.slug}`)}
        >
          {product.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" color="primary" fontWeight={700}>
            ${product.price.toLocaleString('es-AR')}
          </Typography>
          {product.compare_price && (
            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
              ${product.compare_price.toLocaleString('es-AR')}
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddShoppingCartIcon />}
          disabled={product.stock === 0}
          onClick={() => addItem(product)}
        >
          Agregar al carrito
        </Button>
      </CardActions>
    </Card>
  );
}
