import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d47a1',
      light: '#5472d3',
      dark: '#002171',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f57c00',
      light: '#ffad42',
      dark: '#bb4d00',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#c62828',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#4a4a6a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        containedPrimary: {
          boxShadow: '0 2px 8px rgba(13, 71, 161, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(13, 71, 161, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 8px rgba(0,0,0,0.12)',
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);
export default theme;
