import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Order } from '../../lib/types';

const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pendiente', color: 'warning' },
  paid: { label: 'Pagado', color: 'info' },
  processing: { label: 'Procesando', color: 'info' },
  shipped: { label: 'Enviado', color: 'primary' },
  delivered: { label: 'Entregado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'error' },
  refunded: { label: 'Reembolsado', color: 'default' },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data as Order[]);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Mis Pedidos</Typography>

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <ReceiptLongIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6">No tienes pedidos aún</Typography>
          <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>Explorar productos</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orders.map(order => {
            const cfg = statusConfig[order.status] || { label: order.status, color: 'default' };
            return (
              <Card key={order.id}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" fontSize={12}>
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Typography>
                    </Box>
                    <Chip label={cfg.label} color={cfg.color} size="small" />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    {order.items?.map(item => (
                      <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{item.product_name} x{item.quantity}</Typography>
                        <Typography variant="body2" fontWeight={500}>${item.total_price.toLocaleString('es-AR')}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Total: ${order.total.toLocaleString('es-AR')}
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => navigate(`/orders/${order.id}`)}>
                      Ver detalle
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Container>
  );
}
