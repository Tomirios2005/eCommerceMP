import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../lib/types';
import { useCart } from '../../context/CartContext';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('products')
      .select('*, category:categories(*), images:product_images(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProduct(data as Product);
          setSelectedImage(data.main_image);
        }
        setLoading(false);
      });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Producto no encontrado</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Volver al inicio</Button>
      </Container>
    );
  }

  const allImages = [product.main_image, ...(product.images?.map(i => i.url) || [])].filter(Boolean);
  const discount = product.compare_price ? Math.round((1 - product.price / product.compare_price) * 100) : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component="button" onClick={() => navigate('/')} underline="hover" color="inherit">Inicio</Link>
        {product.category && (
          <Link component="button" onClick={() => navigate('/')} underline="hover" color="inherit">{product.category.name}</Link>
        )}
        <Typography color="text.primary" noWrap sx={{ maxWidth: 200 }}>{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Box component="img" src={selectedImage || 'https://via.placeholder.com/600x500'} alt={product.name} sx={{ width: '100%', height: { xs: 300, md: 450 }, objectFit: 'contain', bgcolor: 'grey.50' }} />
          </Box>
          {allImages.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {allImages.map((img, idx) => (
                <Box
                  key={idx}
                  component="img"
                  src={img}
                  sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', border: 2, borderColor: selectedImage === img ? 'primary.main' : 'transparent', '&:hover': { borderColor: 'primary.light' } }}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </Box>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {product.category && <Chip label={product.category.name} size="small" sx={{ mb: 1 }} />}
          <Typography variant="h4" fontWeight={700} gutterBottom>{product.name}</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h4" color="primary" fontWeight={700}>
              ${product.price.toLocaleString('es-AR')}
            </Typography>
            {product.compare_price && (
              <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                ${product.compare_price.toLocaleString('es-AR')}
              </Typography>
            )}
            {discount && <Chip label={`-${discount}%`} color="secondary" size="small" />}
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
            {product.description}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="body2" fontWeight={500}>Cantidad:</Typography>
            <TextField
              type="number"
              value={quantity}
              onChange={e => setQuantity(Math.min(Math.max(1, Number(e.target.value)), product.stock))}
              inputProps={{ min: 1, max: product.stock }}
              size="small"
              sx={{ width: 80 }}
              disabled={product.stock === 0}
            />
            <Typography variant="body2" color={product.stock > 0 ? 'success.main' : 'error.main'} fontWeight={500}>
              {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AddShoppingCartIcon />}
            disabled={product.stock === 0}
            onClick={handleAddToCart}
            color={added ? 'success' : 'primary'}
            sx={{ mb: 2 }}
          >
            {added ? '¡Agregado!' : 'Agregar al carrito'}
          </Button>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              { icon: <LocalShippingOutlinedIcon />, text: 'Envío a todo el país' },
              { icon: <VerifiedUserOutlinedIcon />, text: 'Compra protegida' },
            ].map((item, idx) => (
              <Grid key={idx} size={{ xs: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  {item.icon}
                  <Typography variant="caption">{item.text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
