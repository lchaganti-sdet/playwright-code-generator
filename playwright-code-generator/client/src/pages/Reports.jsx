import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Download, Visibility } from '@mui/icons-material';

const Reports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Fetch reports from your backend
    // This is a placeholder - implement actual API call
    setReports([
      {
        id: 1,
        date: '2024-05-15',
        scenario: 'Login Flow',
        status: 'passed',
        duration: '1.2s',
        steps: 5
      },
      // Add more sample reports
    ]);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Test Execution Reports
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Scenario</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Steps</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.date}</TableCell>
                <TableCell>{report.scenario}</TableCell>
                <TableCell>
                  <Chip
                    label={report.status}
                    color={report.status === 'passed' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{report.duration}</TableCell>
                <TableCell>{report.steps}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download Report">
                    <IconButton size="small">
                      <Download />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Reports; 