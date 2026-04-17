import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid,
  TextField, Select, MenuItem, FormControl, InputLabel,
  FormControlLabel, Switch, CircularProgress, Alert, Divider
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { supabase } from '../../lib/supabase';
import type { Category } from '../../lib/types';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

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

  // ==================== CARGA INICIAL ====================
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError(error.message);
      } else if (data) {
        setForm({
          ...data,
          price: String(data.price),
          compare_price: data.compare_price ? String(data.compare_price) : '',
          stock: String(data.stock),
        });
      }

      setLoading(false);
    };

    fetchProduct();
  }, [id, isEdit]);

  // ==================== INPUTS ====================
  const handleChange = (field: string) => (e: any) => {
    const value = e.target.value;

    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && !isEdit ? { slug: slugify(value) } : {})
    }));
  };

  // ==================== FILE ====================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name);

    // Preview instantáneo
    const preview = URL.createObjectURL(selectedFile);
    setForm(prev => ({ ...prev, main_image: preview }));
  };

  // ==================== UPLOAD ====================
  const handleUploadMainImage = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `public/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError){ console.log(uploadError); throw uploadError};

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setForm(prev => ({
        ...prev,
        main_image: data.publicUrl
      }));

      setFile(null);
      setFileName('');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };
  const createNewCategory = async () => {
    const name = prompt('Nombre de la nueva categoría');
    if (!name) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setForm(prev => ({ ...prev, category_id: data.id }));

    } catch (err: any) {
      alert('Error al crear categoría: ' + err.message);
    }
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.name || !form.price) {
      setError('Nombre y precio son obligatorios');
      setSaving(false);
      return;
    }

    try {
      const productData = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        stock: Number(form.stock) || 0,
        sku: form.sku,
        main_image: form.main_image,
        category_id: form.category_id || null,
        is_active: form.is_active,
      };

      let error;

      if (isEdit) {
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id));
      } else {
        ({ error } = await supabase
          .from('products')
          .insert([productData]));
      }

      if (error) throw error;

      navigate('/admin/products');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  // ==================== UI ====================
  return (
    <Box>
      <Typography variant="h4" mb={3}>
        {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>

          {/* IZQUIERDA */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={form.name}
                  onChange={handleChange('name')}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Slug"
                  value={form.slug}
                  onChange={handleChange('slug')}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción"
                  value={form.description}
                  onChange={handleChange('description')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <TextField
                  fullWidth
                  label="Precio"
                  type="number"
                  value={form.price}
                  onChange={handleChange('price')}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Precio Comparación"
                  type="number"
                  value={form.compare_price}
                  onChange={handleChange('compare_price')}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Stock"
                  type="number"
                  value={form.stock}
                  onChange={handleChange('stock')}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* DERECHA */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Imagen Principal
                </Typography>

                {form.main_image ? (
                  <Box
                    component="img"
                    src={form.main_image}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 2,
                      mb: 2,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                      borderRadius: 2,
                    }}
                  >
                    <AddPhotoAlternateIcon fontSize="large" />
                  </Box>
                )}

                <Button component="label" fullWidth variant="outlined" sx={{ mb: 2 }}>
                  Elegir imagen
                  <input hidden type="file" onChange={handleFileChange} />
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleUploadMainImage}
                  disabled={!file || uploading}
                  startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                >
                  {uploading ? 'Subiendo...' : 'Subir'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Categoría</InputLabel>
                  <Select required
                    value={form.category_id}
                    label="Categoría"
                    onChange={handleChange('category_id')}
                  >
                    <MenuItem value="">Sin categoría</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                    <MenuItem 
                      onClick={createNewCategory}
                    >nueva</MenuItem>
                    
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm(prev => ({ ...prev, is_active: e.target.checked }))
                      }
                    />
                  }
                  label="Activo"
                />
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }} />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
}