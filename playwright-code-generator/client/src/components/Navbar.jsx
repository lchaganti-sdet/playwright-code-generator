import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Code, PlayArrow, Assessment, VideoLibrary } from '@mui/icons-material';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Playwright Code Generator
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<Assessment />}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/recording"
            startIcon={<VideoLibrary />}
          >
            Recording
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/execution"
            startIcon={<PlayArrow />}
          >
            Execution
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/generator"
            startIcon={<Code />}
          >
            Code Generator
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 