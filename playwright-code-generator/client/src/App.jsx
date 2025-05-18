import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Recording from './pages/Recording';
import TestExecution from './pages/TestExecution';
import Reports from './pages/Reports';
import CodeGenerator from './pages/CodeGenerator';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/recording" element={<Recording />} />
              <Route path="/execution" element={<TestExecution />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/generator" element={<CodeGenerator />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 