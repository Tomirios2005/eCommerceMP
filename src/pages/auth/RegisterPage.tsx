import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
        <Card sx={{ width: '100%', maxWidth: 420 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>¡Cuenta creada exitosamente!</Alert>
            <Typography>Redirigiendo al inicio...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'inline-flex', bgcolor: 'primary.main', color: 'white', p: 1.5, borderRadius: 2, mb: 2 }}>
              <StorefrontIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>Crear cuenta</Typography>
            <Typography variant="body2" color="text.secondary">
              Únete a {import.meta.env.VITE_APP_NAME || 'MiTienda'}
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
            Registrarse con Google
          </Button>

          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">o con tu email</Typography>
          </Divider>

          <Box component="form" onSubmit={handleRegister}>
            <TextField label="Nombre completo" fullWidth value={fullName} onChange={e => setFullName(e.target.value)} required sx={{ mb: 2 }} />
            <TextField label="Email" type="email" fullWidth value={email} onChange={e => setEmail(e.target.value)} required sx={{ mb: 2 }} />
            <TextField label="Contraseña" type="password" fullWidth value={password} onChange={e => setPassword(e.target.value)} required sx={{ mb: 2 }} />
            <TextField label="Confirmar contraseña" type="password" fullWidth value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required sx={{ mb: 3 }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Crear cuenta'}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 2.5, color: 'text.secondary' }}>
            ¿Ya tienes cuenta?{' '}
            <Link component={RouterLink} to="/login" fontWeight={600}>Iniciar sesión</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
