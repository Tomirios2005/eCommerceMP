import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../lib/types';

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, category:categories(id,name,slug,description,created_at)').order('created_at', { ascending: false });
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query;
    if (data) setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    setDeleteId(null);
    if (error) {
      setSnackbar({ open: true, message: 'Error al eliminar el producto', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Producto eliminado', severity: 'success' });
      fetchProducts();
    }
  };

  const handleToggleActive = async (product: Product) => {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    fetchProducts();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Productos</Typography>
          <Typography variant="body2" color="text.secondary">{products.length} productos en total</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/products/new')}>
          Nuevo producto
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 2 }}>
          <TextField
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2, width: { xs: '100%', sm: 320 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No hay productos
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map(product => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={product.main_image} variant="rounded" sx={{ width: 48, height: 48 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{product.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{product.sku}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{product.category?.name || '-'}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>${product.price.toLocaleString('es-AR')}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={product.stock}
                            size="small"
                            color={product.stock === 0 ? 'error' : product.stock < 5 ? 'warning' : 'success'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.is_active ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={product.is_active ? 'success' : 'default'}
                            onClick={() => handleToggleActive(product)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => navigate(`/admin/products/${product.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteId(product.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Eliminar producto</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Estás seguro que deseas eliminar este producto? Esta acción no se puede deshacer.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
