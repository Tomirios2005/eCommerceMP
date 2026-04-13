import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: 'primary.dark', color: 'white', mt: 'auto', py: 5 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <StorefrontIcon />
              <Typography variant="h6" fontWeight={700}>
                {import.meta.env.VITE_APP_NAME || 'MiTienda'}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Tu tienda online de confianza. Los mejores productos al mejor precio.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Navegación</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[{ label: 'Inicio', to: '/' }, { label: 'Mis Pedidos', to: '/orders' }, { label: 'Mi Cuenta', to: '/profile' }].map(link => (
                <Link key={link.to} component={RouterLink} to={link.to} color="inherit" sx={{ opacity: 0.7, '&:hover': { opacity: 1 }, fontSize: 14 }}>
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Medios de Pago</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Aceptamos pagos seguros a través de Mercado Pago.
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ borderTop: 1, borderColor: 'rgba(255,255,255,0.15)', mt: 4, pt: 3, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ opacity: 0.5 }}>
            © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'MiTienda'}. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
