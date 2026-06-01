import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  GridLegacy as Grid,
} from '@mui/material';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ImageIcon from '@mui/icons-material/Image';

import { supabase } from '../../lib/supabase';
import type { Category } from '../../lib/types';
import { getProductById, createProduct, updateProduct } from '../../services/productService';
import { getCategories, createCategory } from '../../services/categoryService';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProductImage {
  /** Id en la BD, indefinido para fotos locales nuevas */
  id?: string;
  url: string;
  sort_order: number;
  /** Archivo local esperando ser subido */
  file?: File;
  /** Blob URL local para la vista previa */
  preview?: string;
  uploading?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uploadToStorage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading,   setLoading]   = useState(isEdit);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  // Centralizamos todas las imágenes en una sola lista (Principales y Secundarias)
  const [images,     setImages]     = useState<ProductImage[]>([]);

  // Drag-and-drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOver,   setDragOver]   = useState<number | null>(null);

  const [form, setForm] = useState({
    name:          '',
    slug:          '',
    description:   '',
    price:         '',
    compare_price: '',
    stock:         '',
    sku:           '',
    category_id:   '',
    is_active:     true,
  });

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    getCategories().then(data => setCategories(data));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;

    getProductById(id).then(async data => {
      if (data) {
        setForm({
          ...data,
          price:         String(data.price),
          compare_price: data.compare_price ? String(data.compare_price) : '',
          stock:         String(data.stock),
          category_id:   data.category_id ?? '',
        });

        // Traemos todas las imágenes ordenadas por sort_order
        const { data: imgs, error: imgErr } = await supabase
          .from('product_images')
          .select('id, url, sort_order')
          .eq('product_id', id)
          .order('sort_order', { ascending: true });

        if (!imgErr && imgs) {
          setImages(imgs.map(img => ({ id: img.id, url: img.url, sort_order: img.sort_order })));
        }
      } else {
        setError('Producto no encontrado');
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  // ── Form helpers ────────────────────────────────────────────────────────────

  const handleChange = (field: string) => (e: any) => {
    const value = e.target.value;
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && !isEdit ? { slug: slugify(value) } : {}),
    }));
  };

  // ── Image Handling (Unificado) ──────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newImgs: ProductImage[] = Array.from(e.target.files).map((f, i) => ({
      url:        URL.createObjectURL(f),
      sort_order: images.length + i,
      file:       f,
      preview:    URL.createObjectURL(f),
    }));
    
    setImages(prev => [...prev, ...newImgs]);
    e.target.value = '';
  };

  const handleUploadImage = async (index: number) => {
    const img = images[index];
    if (!img.file) return;

    setImages(prev =>
      prev.map((item, i) => i === index ? { ...item, uploading: true } : item)
    );

    try {
      const url = await uploadToStorage(img.file);
      if (img.preview) URL.revokeObjectURL(img.preview);

      setImages(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, url, file: undefined, preview: undefined, uploading: false } : item
        )
      );
    } catch (err: any) {
      setError(err.message);
      setImages(prev =>
        prev.map((item, i) => i === index ? { ...item, uploading: false } : item)
      );
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const img = prev[index];
      if (img.preview) URL.revokeObjectURL(img.preview);
      
      const filtered = prev.filter((_, i) => i !== index);
      // Re-indexamos los sort_order para asegurar que no queden baches y que el primero sea 0
      return filtered.map((item, i) => ({ ...item, sort_order: i }));
    });
  };

  const handleSetMainImage = (index: number) => {
    setImages(prev => {
      const next = [...prev];
      // Sacamos la imagen seleccionada de su lugar actual
      const [mainImg] = next.splice(index, 1);
      // La mandamos al principio del array (recibe la posición index 0)
      next.unshift(mainImg);
      // Reasignamos los sort_order basándonos en el nuevo orden físico
      return next.map((item, i) => ({ ...item, sort_order: i }));
    });
  };

  // ── Drag-and-drop ────────────────────────────────────────────────────────────

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragEnter = (index: number) => {
    setDragOver(index);
  };

  const handleDrop = (dropIndex: number) => {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      dragIndexRef.current = null;
      setDragOver(null);
      return;
    }

    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      // Al reordenar físicamente el array, mapeamos el índice como sort_order. El primero pasa a ser 0 (principal)
      return next.map((item, i) => ({ ...item, sort_order: i }));
    });

    dragIndexRef.current = null;
    setDragOver(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOver(null);
  };

  // ── Category Helper ─────────────────────────────────────────────────────────

  const handleCreateCategory = async () => {
    const name = prompt('Nombre de la nueva categoría');
    if (!name) return;
    try {
      const newCat = await createCategory(name);
      setCategories(prev => [...prev, newCat]);
      setForm(prev => ({ ...prev, category_id: newCat.id }));
    } catch (err: any) {
      alert('Error al crear categoría: ' + err.message);
    }
  };

  // ── DB Synchronization ──────────────────────────────────────────────────────

  const syncImages = async (productId: string) => {
    // Limpiamos los registros viejos asociados a este producto
    await supabase.from('product_images').delete().eq('product_id', productId);

    const rows = images
      .filter(img => !img.file) // Solo las que ya están subidas de manera efectiva en Storage
      .map(img => ({
        product_id: productId,
        url:        img.url,
        sort_order: img.sort_order, // Guardamos la secuencia numérica limpia
      }));

    if (rows.length > 0) {
      const { error } = await supabase.from('product_images').insert(rows);
      if (error) throw error;
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.name || !form.price) {
      setError('Nombre y precio son obligatorios');
      setSaving(false);
      return;
    }

    const pending = images.filter(img => !!img.file);
    if (pending.length > 0) {
      setError(`Tenés ${pending.length} imagen(es) sin subir. Subilas antes de guardar el producto.`);
      setSaving(false);
      return;
    }

    try {
      const productData = {
        name:          form.name,
        slug:          form.slug,
        description:   form.description,
        price:         Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        stock:         Number(form.stock) || 0,
        sku:           form.sku,
        category_id:   form.category_id || null,
        is_active:     form.is_active,
        // Ya no mandamos el campo main_image al producto!
      };

      let productId = id;

      if (isEdit && id) {
        await updateProduct(id, productData);
      } else {
        const created = await createProduct(productData);
        productId = created;
      }

      if (productId) {
        await syncImages(productId);
      }

      navigate('/admin/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  const pendingCount = images.filter(img => !!img.file).length;
  // La imagen principal siempre es la que quedó en la posición física 0
  const mainImage = images.find(img => img.sort_order === 0);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>

          {/* ── Column Izquierda (Info y Galería Unificada) ─────────────────── */}
          <Grid item xs={12} md={8}>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Información básica
                </Typography>
                <TextField fullWidth label="Nombre" value={form.name} onChange={handleChange('name')} sx={{ mb: 2 }} />
                <TextField fullWidth label="Slug"   value={form.slug} onChange={handleChange('slug')}  sx={{ mb: 2 }} />
                <TextField fullWidth multiline rows={4} label="Descripción" value={form.description} onChange={handleChange('description')} />
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Precios y stock
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Precio" type="number" value={form.price} onChange={handleChange('price')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Precio comparación" type="number" value={form.compare_price} onChange={handleChange('compare_price')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Stock" type="number" value={form.stock} onChange={handleChange('stock')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="SKU" value={form.sku} onChange={handleChange('sku')} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* ── Galería de Imágenes Unificada ───────────────────────────── */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Galería de imágenes
                    </Typography>
                    {images.length > 0 && (
                      <Chip label={images.length} size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                  <Button component="label" variant="outlined" size="small" startIcon={<AddPhotoAlternateIcon />}>
                    Agregar fotos
                    <input hidden type="file" multiple accept="image/*" onChange={handleFileChange} />
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  La primera imagen <strong>(#1)</strong> será la principal. Arrastralas para reordenar o usá la estrella para definir la principal.
                </Typography>

                {pendingCount > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {pendingCount} imagen{pendingCount > 1 ? 'es' : ''} sin subir — hacé click en el ícono ↑ de la foto antes de guardar.
                  </Alert>
                )}

                {images.length === 0 ? (
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">El producto no tiene imágenes asignadas</Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: 2,
                    }}
                  >
                    {images.map((img, index) => {
                      const isMain = img.sort_order === 0;
                      return (
                        <Box
                          key={img.id ?? img.preview ?? img.url}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragEnter={() => handleDragEnter(index)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleDrop(index)}
                          onDragEnd={handleDragEnd}
                          sx={{
                            position: 'relative',
                            border: '2px solid',
                            borderColor: isMain 
                              ? 'warning.main' 
                              : dragOver === index ? 'primary.main' : 'grey.200',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                            cursor: 'grab',
                            transition: 'all 0.15s ease-in-out',
                            '&:active': { cursor: 'grabbing' },
                            ...(dragOver === index && {
                              transform: 'scale(1.03)',
                              boxShadow: 4,
                            }),
                          }}
                        >
                          {/* Miniatura */}
                          <Box
                            component="img"
                            src={img.preview ?? img.url}
                            alt={`Imagen ${index + 1}`}
                            sx={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                          />

                          {/* Capa de acciones sobre la foto */}
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              bgcolor: isMain ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0)',
                              transition: 'background-color 0.2s',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              p: 0.5,
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <DragIndicatorIcon sx={{ color: 'white', opacity: 0.8, fontSize: 18 }} />
                              <Chip
                                label={isMain ? "Principal" : `#${index + 1}`}
                                size="small"
                                color={isMain ? "warning" : "default"}
                                sx={{ 
                                  color: 'white', 
                                  height: 18, 
                                  fontSize: 10, 
                                  bgcolor: isMain ? 'warning.main' : 'rgba(0,0,0,0.6)' 
                                }}
                              />
                            </Box>

                            <Box display="flex" justifyContent="flex-end" gap={0.5}>
                              {img.file && (
                                <Tooltip title="Subir a Storage">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleUploadImage(index)}
                                      disabled={img.uploading}
                                      sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' }, color: 'white', p: '4px' }}
                                    >
                                      {img.uploading
                                        ? <CircularProgress size={14} sx={{ color: 'white' }} />
                                        : <CloudUploadIcon sx={{ fontSize: 16 }} />
                                      }
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                              
                              {!isMain && (
                                <Tooltip title="Hacer principal">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSetMainImage(index)}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, color: 'warning.main', p: '4px' }}
                                  >
                                    <StarBorderIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveImage(index)}
                                  sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' }, color: 'white', p: '4px' }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          {img.file && !img.uploading && (
                            <Chip
                              label="Pendiente"
                              size="small"
                              color="warning"
                              sx={{
                                position: 'absolute',
                                bottom: 6,
                                left: 6,
                                height: 18,
                                fontSize: 10,
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ── Column Derecha (Preview Principal y Organización) ────────────── */}
          <Grid item xs={12} md={4}>

            {/* Preview de la imagen destacada actual */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <StarIcon fontSize="small" sx={{ color: 'warning.main' }} />
                  <Typography variant="subtitle1" fontWeight={600}>Vista previa principal</Typography>
                </Box>

                {mainImage ? (
                  <Box
                    component="img"
                    src={mainImage.preview ?? mainImage.url}
                    sx={{ 
                      width: '100%', 
                      height: 220, 
                      objectFit: 'cover', 
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'warning.light'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 220,
                      bgcolor: 'grey.50',
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 2,
                      gap: 1,
                      color: 'text.secondary',
                    }}
                  >
                    <AddPhotoAlternateIcon fontSize="large" sx={{ opacity: 0.5 }} />
                    <Typography variant="caption">Cargá fotos a la galería</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Organización
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Categoría</InputLabel>
                  <Select value={form.category_id} label="Categoría" onChange={handleChange('category_id')}>
                    <MenuItem value="">Sin categoría</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                    <MenuItem onClick={handleCreateCategory}>+ Nueva categoría</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_active}
                      onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
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
              size="large"
              disabled={saving}
            >
              {saving
                ? <CircularProgress size={22} />
                : isEdit ? 'Guardar cambios' : 'Crear producto'
              }
            </Button>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
}