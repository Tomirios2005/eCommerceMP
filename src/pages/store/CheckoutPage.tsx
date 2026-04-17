import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import type { ShippingAddress } from "../../lib/types";
import { createOrder, createPaymentPreference } from "../../services/orderService";

const SHIPPING_COST = 500;

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [address, setAddress] = useState<ShippingAddress>({
    full_name: "",
    street:    "",
    city:      "",
    state:     "",
    zip_code:  "",
    country:   "Argentina",
    phone:     "",
  });

  const total = subtotal + SHIPPING_COST;

  const handleChange =
    (field: keyof ShippingAddress) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setAddress(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user)              { navigate("/login"); return; }
    if (items.length === 0) return;

    setLoading(true);
    setError("");

    try {
      // ── 1. Get a fresh session token ────────────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión expirada. Volvé a iniciar sesión.");

      // ── 2. Create order atomically (validates stock + decrements it) ────────
      const orderId = await createOrder({
        userId:       user.id,
        total,
        subtotal,
        shippingCost: SHIPPING_COST,
        address:      address as unknown as Record<string, string>,
        items:        items.map(item => ({
          product_id:    item.product.id,
          product_name:  item.product.name,
          product_image: item.product.main_image ?? "",
          quantity:      item.quantity,
          unit_price:    item.product.price,
          total_price:   item.product.price * item.quantity,
        })),
      });

      // ── 3. Create Mercado Pago preference ───────────────────────────────────
      const mpData = await createPaymentPreference(orderId, items, total, session.access_token);

      // ── 4. Clear cart then redirect to payment ──────────────────────────────
      await clearCart();

      window.location.href = mpData.init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pedido");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6">Tu carrito está vacío</Typography>
        <Button onClick={() => navigate("/")} sx={{ mt: 2 }} variant="contained">
          Ver productos
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Checkout
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* ── Shipping address form ──────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Dirección de envío
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField label="Nombre completo" fullWidth required
                      value={address.full_name} onChange={handleChange("full_name")} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField label="Calle y número" fullWidth required
                      value={address.street} onChange={handleChange("street")} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Ciudad" fullWidth required
                      value={address.city} onChange={handleChange("city")} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Provincia" fullWidth required
                      value={address.state} onChange={handleChange("state")} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Código postal" fullWidth required
                      value={address.zip_code} onChange={handleChange("zip_code")} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Teléfono" fullWidth required
                      value={address.phone} onChange={handleChange("phone")} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ mt: 1 }}
                    >
                      {loading ? (
                        <CircularProgress size={22} color="inherit" />
                      ) : (
                        `Pagar con Mercado Pago — $${total.toLocaleString("es-AR")}`
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Order summary ───────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Resumen del pedido
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
                {items.map(item => (
                  <Box key={item.product.id} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Avatar src={item.product.main_image} variant="rounded" sx={{ width: 56, height: 56 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{item.product.name}</Typography>
                      <Typography variant="caption" color="text.secondary">x{item.quantity}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      ${(item.product.price * item.quantity).toLocaleString("es-AR")}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">${subtotal.toLocaleString("es-AR")}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Envío</Typography>
                <Typography variant="body2">${SHIPPING_COST.toLocaleString("es-AR")}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  ${total.toLocaleString("es-AR")}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
