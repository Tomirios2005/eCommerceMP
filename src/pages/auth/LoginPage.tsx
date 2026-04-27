import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GoogleIcon from '@mui/icons-material/Google';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data,error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message);
      setLoading(false);
    } else if (!error) {
      const token=data.session?.access_token;
      if(token) localStorage.setItem('sb-access-token', token);
      navigate(from, { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const {data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/popup-callback`,       skipBrowserRedirect: true,
    },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
      return;
    }
    if(data?.url) {
      window.open(data.url,
        'googleLogin',
        'width=500,height=700'
      );
    }
    setGoogleLoading(false);
  };
  useEffect(() => {
    const listener=(event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'google-login-success') {
        navigate(from, { replace: true });
      }
        
    }
    window.addEventListener("message", listener);
        return () => window.removeEventListener("message", listener);
  }, [navigate, from]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'inline-flex', bgcolor: 'primary.main', color: 'white', p: 1.5, borderRadius: 2, mb: 2 }}>
              <StorefrontIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>Iniciar Sesión</Typography>
            <Typography variant="body2" color="text.secondary">
              Accede a tu cuenta de {import.meta.env.VITE_APP_NAME || 'MiTienda'}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            fullWidth
            variant="outlined"
            startIcon={googleLoading ? <CircularProgress size={16} /> : <GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            sx={{ mb: 2, py: 1.2 }}
          >
            Continuar con Google
          </Button>

          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">o con tu email</Typography>
          </Divider>

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Ingresar'}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 2.5, color: 'text.secondary' }}>
            ¿No tienes cuenta?{' '}
            <Link component={RouterLink} to="/register" state={{ from: location.state?.from }} fontWeight={600}>
              Registrarse
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
