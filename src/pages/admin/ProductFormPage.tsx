import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { supabase } from '../../lib/supabase';
import type { Category, Product, ProductImage } from '../../lib/types';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_price: '',
    stock: '',
    sku: '',
    main_image: '',
    category_id: '',
    is_active: true,
  });

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    ]).then(([{ data: product }, { data: imgs }]) => {
      if (product) {
        const p = product as Product;
        setForm({
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: String(p.price),
          compare_price: p.compare_price ? String(p.compare_price) : '',
          stock: String(p.stock),
          sku: p.sku,
          main_image: p.main_image,
          category_id: p.category_id || '',
          is_active: p.is_active,
        });
      }
      if (imgs) setImages(imgs as ProductImage[]);
      setLoading(false);
    });
  }, [id, isEdit]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && !isEdit ? { slug: slugify(value) } : {}),
    }));
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim() || !id) return;
    const { data } = await supabase.from('product_images').insert({
      product_id: id,
      url: newImageUrl.trim(),
      sort_order: images.length,
    }).select().single();
    if (data) setImages(prev => [...prev, data as ProductImage]);
    setNewImageUrl('');
  };

  const handleDeleteImage = async (imageId: string) => {
    await supabase.from('product_images').delete().eq('id', imageId);
    setImages(prev => prev.filter(i => i.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const productData = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      stock: parseInt(form.stock),
      sku: form.sku,
      main_image: form.main_image,
      category_id: form.category_id || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    if (isEdit && id) {
      const { error } = await supabase.from('products').update(productData).eq('id', id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('products').insert(productData).select().single();
      if (error) { setError(error.message); setSaving(false); return; }
      if (data && newImageUrl) {
        await supabase.from('product_images').insert({ product_id: data.id, url: newImageUrl, sort_order: 0 });
      }
    }

    navigate('/admin/products');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/admin/products')}><ArrowBackIcon /></IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isEdit ? 'Modifica los datos del producto' : 'Completa los datos para crear un producto'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Información básica</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField label="Nombre del producto" fullWidth value={form.name} onChange={handleChange('name')} required />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField label="Slug (URL)" fullWidth value={form.slug} onChange={handleChange('slug')} required helperText="Se usa en la URL del producto" />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField label="Descripción" fullWidth multiline rows={4} value={form.description} onChange={handleChange('description')} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Precio y stock</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Precio" type="number" fullWidth value={form.price} onChange={handleChange('price')} required inputProps={{ min: 0, step: 0.01 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Precio comparado (tachado)" type="number" fullWidth value={form.compare_price} onChange={handleChange('compare_price')} inputProps={{ min: 0, step: 0.01 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Stock" type="number" fullWidth value={form.stock} onChange={handleChange('stock')} required inputProps={{ min: 0 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="SKU" fullWidth value={form.sku} onChange={handleChange('sku')} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {isEdit && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Imágenes secundarias</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {images.map(img => (
                      <Box key={img.id} sx={{ position: 'relative' }}>
                        <Avatar src={img.url} variant="rounded" sx={{ width: 80, height: 80 }} />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteImage(img.id)}
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'white', boxShadow: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="URL de imagen secundaria"
                      fullWidth
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      size="small"
                    />
                    <Button variant="outlined" onClick={handleAddImage} startIcon={<AddPhotoAlternateIcon />}>
                      Agregar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Imagen principal</Typography>
                {form.main_image && (
                  <Box component="img" src={form.main_image} alt="preview" sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 1, mb: 1.5 }} />
                )}
                {!form.main_image && (
                  <Box sx={{ width: '100%', height: 180, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                    <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                  </Box>
                )}
                <TextField label="URL de imagen principal" fullWidth value={form.main_image} onChange={handleChange('main_image')} size="small" />
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Organización</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={form.category_id}
                    label="Categoría"
                    onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    <MenuItem value="">Sin categoría</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={<Switch checked={form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} color="success" />}
                  label="Producto activo"
                />
              </CardContent>
            </Card>

            <Divider sx={{ mb: 2 }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={saving}>
              {saving ? <CircularProgress size={22} color="inherit" /> : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
