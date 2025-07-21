import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Add Roboto font link to the document head
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const theme = createTheme({
  palette: {
    primary: {
      main: 'rgb(228, 153, 50)',
      contrastText: '#ffffff', // Set text color to white
    },
    background: {
      default: '#f4f6f8',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);