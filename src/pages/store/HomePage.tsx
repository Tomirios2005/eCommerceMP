import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import { supabase } from '../../lib/supabase';
import type { Product, Category } from '../../lib/types';
import ProductCard from '../../components/product/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, category:categories(id,name,slug,description,created_at), images:product_images(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (selectedCategory) query = query.eq('category_id', selectedCategory);
    if (search) query = query.ilike('name', `%${search}%`);

    query.then(({ data }) => {
      if (data) setProducts(data as Product[]);
      setLoading(false);
    });
  }, [selectedCategory, search]);

  return (
    <Box>
      <Box sx={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)', color: 'white', py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Bienvenido a {import.meta.env.VITE_APP_NAME || 'MiTienda'}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, mb: 4 }}>
            Los mejores productos al mejor precio
          </Typography>
          <TextField
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2, width: { xs: '100%', sm: 480 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
          <Chip
            label="Todos"
            onClick={() => setSelectedCategory(null)}
            color={selectedCategory === null ? 'primary' : 'default'}
            variant={selectedCategory === null ? 'filled' : 'outlined'}
          />
          {categories.map(cat => (
            <Chip
              key={cat.id}
              label={cat.name}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              color={selectedCategory === cat.id ? 'primary' : 'default'}
              variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h6">No se encontraron productos</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
            </Typography>
            <Grid container spacing={3}>
              {products.map(product => (
                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}
