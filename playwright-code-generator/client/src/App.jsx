import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import Recording from './pages/Recording';
import TestExecution from './pages/TestExecution';
import CodeGenerator from './pages/CodeGenerator';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <>
      <Navbar />
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recording" element={<Recording />} />
          <Route path="/execution" element={<TestExecution />} />
          <Route path="/generator" element={<CodeGenerator />} />
        </Routes>
      </Container>
    </>
  );
}

export default App; 