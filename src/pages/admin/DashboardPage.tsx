import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import { supabase } from '../../lib/supabase';
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

interface Stats {
  products: number;
  orders: number;
  revenue: number;
  users: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, revenue: 0, users: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id, total, status', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([products, orders, users]) => {
      const revenue = (orders.data || []).filter(o => o.status === 'paid' || o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
      setStats({
        products: products.count || 0,
        orders: orders.count || 0,
        revenue,
        users: users.count || 0,
      });
    });

    supabase
      .from('orders')
      .select('*, items:order_items(product_name, quantity)')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentOrders(data as Order[]);
        setLoading(false);
      });
  }, []);

  const statCards = [
    { label: 'Productos', value: stats.products, icon: <InventoryIcon />, color: '#0d47a1' },
    { label: 'Pedidos', value: stats.orders, icon: <ShoppingBagIcon />, color: '#f57c00' },
    { label: 'Ingresos', value: `$${stats.revenue.toLocaleString('es-AR')}`, icon: <AttachMoneyIcon />, color: '#2e7d32' },
    { label: 'Usuarios', value: stats.users, icon: <PeopleIcon />, color: '#0288d1' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Resumen general de tu tienda</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map(card => (
          <Grid key={card.label} size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                  <Box sx={{ bgcolor: card.color, color: 'white', p: 1, borderRadius: 1.5, display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h5" fontWeight={700}>{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Últimos pedidos</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {recentOrders.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay pedidos aún</Typography>
            ) : (
              recentOrders.map(order => {
                const cfg = statusConfig[order.status] || { label: order.status, color: 'default' as const };
                return (
                  <Box key={order.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'background.default', borderRadius: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>#{order.id.slice(0, 8).toUpperCase()}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString('es-AR')}
                      </Typography>
                    </Box>
                    <Chip label={cfg.label} color={cfg.color} size="small" />
                    <Typography variant="body2" fontWeight={600}>${order.total.toLocaleString('es-AR')}</Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
