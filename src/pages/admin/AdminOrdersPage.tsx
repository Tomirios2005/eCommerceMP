import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus } from '../../lib/types';

const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pendiente', color: 'warning' },
  paid: { label: 'Pagado', color: 'info' },
  processing: { label: 'Procesando', color: 'info' },
  shipped: { label: 'Enviado', color: 'primary' },
  delivered: { label: 'Entregado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'error' },
  refunded: { label: 'Reembolsado', color: 'default' },
};

const allStatuses: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (error) {
      setSnackbar({ open: true, message: 'Error al actualizar el estado', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Estado actualizado', severity: 'success' });
      fetchOrders();
      if (selected?.id === orderId) setSelected(prev => prev ? { ...prev, status } : null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Pedidos</Typography>
        <Typography variant="body2" color="text.secondary">{orders.length} pedidos en total</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pedido</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No hay pedidos
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map(order => {
                      return (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>#{order.id.slice(0, 8).toUpperCase()}</Typography>
                            <Typography variant="caption" color="text.secondary">{order.items?.length || 0} items</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{new Date(order.created_at).toLocaleDateString('es-AR')}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>${order.total.toLocaleString('es-AR')}</Typography>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              size="small"
                              sx={{ fontSize: 13 }}
                            >
                              {allStatuses.map(s => (
                                <MenuItem key={s} value={s}>{statusConfig[s].label}</MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined" onClick={() => setSelected(order)}>
                              Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>
              Pedido #{selected.id.slice(0, 8).toUpperCase()}
              <Chip
                label={statusConfig[selected.status]?.label}
                color={statusConfig[selected.status]?.color}
                size="small"
                sx={{ ml: 1.5 }}
              />
            </DialogTitle>
            <DialogContent>
              <Typography variant="caption" color="text.secondary">
                {new Date(selected.created_at).toLocaleString('es-AR')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Productos</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {selected.items?.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{item.product_name} x{item.quantity}</Typography>
                    <Typography variant="body2" fontWeight={500}>${item.total_price.toLocaleString('es-AR')}</Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">${selected.subtotal.toLocaleString('es-AR')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Envío</Typography>
                <Typography variant="body2">${selected.shipping_cost.toLocaleString('es-AR')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary">${selected.total.toLocaleString('es-AR')}</Typography>
              </Box>
              {selected.shipping_address && typeof selected.shipping_address === 'object' && (selected.shipping_address as { full_name?: string }).full_name && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Dirección de envío</Typography>
                  {(() => {
                    const addr = selected.shipping_address as { full_name?: string; street?: string; city?: string; state?: string; zip_code?: string };
                    return (
                      <Typography variant="body2" color="text.secondary">
                        {addr.full_name} — {addr.street}, {addr.city}, {addr.state} ({addr.zip_code})
                      </Typography>
                    );
                  })()}
                </>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Cambiar estado</Typography>
              <Select
                fullWidth
                size="small"
                value={selected.status}
                onChange={e => handleStatusChange(selected.id, e.target.value as OrderStatus)}
              >
                {allStatuses.map(s => (
                  <MenuItem key={s} value={s}>{statusConfig[s].label}</MenuItem>
                ))}
              </Select>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
