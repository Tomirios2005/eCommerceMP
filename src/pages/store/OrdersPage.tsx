import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentIcon from '@mui/icons-material/Payment';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Order } from '../../lib/types';

const statusConfig: Record<string, {
  label: string;
  color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}> = {
  pending:    { label: 'Pendiente de pago', color: 'warning' },
  paid:       { label: 'Pagado',            color: 'info'    },
  processing: { label: 'Procesando',        color: 'info'    },
  shipped:    { label: 'Enviado',           color: 'primary' },
  delivered:  { label: 'Entregado',         color: 'success' },
  cancelled:  { label: 'Cancelado',         color: 'error'   },
  refunded:   { label: 'Reembolsado',       color: 'default' },
};

const paymentAlerts = {
  success: { severity: 'success' as const, text: 'Tu pago fue procesado exitosamente. El estado de tu pedido se actualizará en breve.' },
  failure: { severity: 'error'   as const, text: 'El pago no pudo completarse. Podés intentarlo de nuevo desde el pedido pendiente.' },
  pending: { severity: 'info'    as const, text: 'Tu pago está siendo revisado. Te notificaremos cuando se confirme.' },
};

export default function OrdersPage() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [payingId,      setPayingId]      = useState<string | null>(null);
  const [payError,      setPayError]      = useState('');

  const paymentStatus = searchParams.get('payment') as keyof typeof paymentAlerts | null;

  // ── Load orders ────────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Re-fetch after returning from MP to pick up webhook status change
  useEffect(() => {
    if (paymentStatus === 'success' || paymentStatus === 'pending') {
      const t = setTimeout(loadOrders, 3000);
      return () => clearTimeout(t);
    }
  }, [paymentStatus, loadOrders]);

  // ── Pay / retry payment ────────────────────────────────────────────────────
  const handlePay = async (order: Order) => {
    if (!session) { navigate('/login'); return; }

    setPayingId(order.id);
    setPayError('');

    try {
      // Reconstruct CartItem shape from saved order_items
      const items = (order.items ?? []).map(item => ({
        product: {
          id:         item.product_id ?? '',
          name:       item.product_name,
          price:      item.unit_price,
          main_image: item.product_image ?? '',
        },
        quantity: item.quantity,
      }));

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mercadopago-preference`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey:         import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization:  `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ orderId: order.id, items, total: order.total }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error de red' }));
        throw new Error(err.error || 'Error al crear la preferencia de pago');
      }

      const data = await res.json();
      const initPoint = import.meta.env.DEV ? data.sandbox_init_point : data.init_point;
      window.location.href = initPoint;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setPayingId(null);
    }
  };

  const dismissPaymentAlert = () => {
    setSearchParams({}, { replace: true });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Mis Pedidos
      </Typography>

      {/* Payment result banners */}
      {paymentStatus && paymentAlerts[paymentStatus] && (
        <Alert
          severity={paymentAlerts[paymentStatus].severity}
          onClose={dismissPaymentAlert}
          sx={{ mb: 3 }}
        >
          {paymentAlerts[paymentStatus].text}
        </Alert>
      )}

      {/* Pay action error */}
      {payError && (
        <Alert severity="error" onClose={() => setPayError('')} sx={{ mb: 3 }}>
          {payError}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <ReceiptLongIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6">No tenés pedidos aún</Typography>
          <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
            Explorar productos
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orders.map(order => {
            const cfg = statusConfig[order.status] ?? { label: order.status, color: 'default' };
            const isPending = order.status === 'pending';
            const isPaying  = payingId === order.id;

            return (
              <Card
                key={order.id}
                variant="outlined"
                sx={isPending ? { borderColor: 'warning.main', borderWidth: 1.5 } : undefined}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" fontSize={12}>
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString('es-AR', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                    <Chip label={cfg.label} color={cfg.color} size="small" />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Items */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    {order.items?.map(item => (
                      <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {item.product_image && (
                          <Avatar
                            src={item.product_image}
                            variant="rounded"
                            sx={{ width: 44, height: 44, flexShrink: 0 }}
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>{item.product_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            x{item.quantity} · ${item.unit_price.toLocaleString('es-AR')} c/u
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
                          ${item.total_price.toLocaleString('es-AR')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Footer row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Total: ${order.total.toLocaleString('es-AR')}
                      </Typography>
                      {order.shipping_cost > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Incl. envío ${order.shipping_cost.toLocaleString('es-AR')}
                        </Typography>
                      )}
                    </Box>

                    {isPending && (
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        disabled={isPaying}
                        startIcon={isPaying ? <CircularProgress size={14} color="inherit" /> : <PaymentIcon />}
                        onClick={() => handlePay(order)}
                      >
                        {isPaying ? 'Redirigiendo…' : 'Completar pago'}
                      </Button>
                    )}
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
