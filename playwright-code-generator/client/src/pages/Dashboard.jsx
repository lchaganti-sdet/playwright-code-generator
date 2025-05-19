import React from 'react';
import { Box, Grid, Paper, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Code, PlayArrow, Assessment, VideoLibrary } from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Record Tests',
      description: 'Record your test scenarios by interacting with the application',
      icon: <VideoLibrary fontSize="large" />,
      path: '/recording'
    },
    {
      title: 'Execute Tests',
      description: 'Run your recorded or imported test scenarios',
      icon: <PlayArrow fontSize="large" />,
      path: '/execution'
    },
    {
      title: 'Generate Code',
      description: 'Generate Playwright test code from your scenarios',
      icon: <Code fontSize="large" />,
      path: '/generator'
    },
    {
      title: 'View Reports',
      description: 'View detailed test execution reports',
      icon: <Assessment fontSize="large" />,
      path: '/reports'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Playwright Code Generator
      </Typography>
      <Typography variant="body1" paragraph>
        Create, record, and execute automated tests with ease. Choose a feature below to get started.
      </Typography>
      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.title}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                '&:hover': {
                  boxShadow: 6,
                  cursor: 'pointer'
                }
              }}
              onClick={() => navigate(feature.path)}
            >
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 