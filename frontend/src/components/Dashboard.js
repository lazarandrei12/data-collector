import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import FileUpload from './upload';
import DataEditor from './DataEditor';

const Dashboard = () => {
  const [fileImports, setFileImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingImport, setEditingImport] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [stats, setStats] = useState({
    totalImports: 0,
    todayImports: 0
  });

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch file imports
      const importsResponse = await fetch('http://localhost/datacollector-api/api/file-imports.php');
      const importsResult = await importsResponse.json();
      
      if (importsResult.success && importsResult.data) {
        setFileImports(importsResult.data);
        calculateStats(importsResult.data);
      } else {
        console.error('File imports error:', importsResult.error);
        showNotification('Error loading data: ' + importsResult.error, 'error');
      }
      
      console.log('API Response - Imports:', importsResult);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Error fetching data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (imports) => {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = imports.filter(imp => 
      imp.import_started_at && imp.import_started_at.startsWith(today)
    ).length;
    
    setStats({
      totalImports: imports.length,
      todayImports: todayCount
    });
  };

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    setUploadDialogOpen(false);
    fetchData(); // Refresh data
    showNotification(`File "${result.fileName}" uploaded successfully!`, 'success');
  };

  const handleDeleteClick = (importData) => {
    setSelectedImport(importData);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedImport) return;
    
    try {
      const response = await fetch('http://localhost/datacollector-api/api/delete-import.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedImport.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification(`File "${selectedImport.original_filename}" deleted successfully!`, 'success');
        fetchData(); // Refresh data
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      showNotification('Error deleting file: ' + error.message, 'error');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedImport(null);
    }
  };

  const handleEditClick = (importData) => {
    setEditingImport(importData);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingImport(null);
    fetchData(); // Refresh data in case changes were made
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PROCESSED': return 'success';
      case 'ERROR': return 'error';
      case 'FAILED': return 'error';
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      default: return 'default';
    }
  };

  const getFileTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'csv': return '📊';
      case 'xlsx': case 'xls': return '📈';
      default: return '📄';
    }
  };

  const importsColumns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{getFileTypeIcon(params.row.file_type)}</span>
          <span>{params.value}</span>
        </Box>
      )
    },
    { 
      field: 'original_filename', 
      headerName: 'File Name', 
      width: 300,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.file_type?.toUpperCase()} • {params.row.file_size_formatted}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'rows_processed', 
      headerName: 'Records', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={`${params.value || 0} rows`}
          size="small" 
          variant="outlined"
          color="primary"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    { 
      field: 'import_started_at', 
      headerName: 'Import Date', 
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">
            {params.value ? new Date(params.value).toLocaleDateString('ro-RO') : '—'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {params.value ? new Date(params.value).toLocaleTimeString('ro-RO', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : ''}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
            title={`Edit data from ${params.row.original_filename}`}
            sx={{ mr: 1 }}
            disabled={params.row.status !== 'PROCESSED'}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            title={`Delete ${params.row.original_filename}`}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Data Collector Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Loading */}
      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading Data Collector...
          </Typography>
        </Box>
      )}



      {/* Main Data Table */}
      {!loading && (
        <Box sx={{ px: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                  📊 Data Management Center
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Manage your imported files and edit data in real-time
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
                sx={{ 
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                  }
                }}
              >
                Import New File
              </Button>
            </Box>

            {fileImports.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                background: '#f8f9fa',
                borderRadius: 2
              }}>
                <CloudUploadIcon sx={{ fontSize: 48, color: '#adb5bd', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No Files Imported Yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Start by importing your first CSV or Excel file
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Import Your First File
                </Button>
              </Box>
            ) : (
              <Box sx={{ height: 450, width: '100%' }}>
                <DataGrid
                  rows={fileImports}
                  columns={importsColumns}
                  pageSize={10}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  disableSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-root': {
                      border: 'none',
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f8f9fa',
                      borderBottom: '2px solid #e0e0e0',
                      fontWeight: 600,
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: '#f8f9ff',
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CloudUploadIcon color="primary" />
            <Typography variant="h6">Import New File</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          ⚠️ Confirm File Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete <strong>"{selectedImport?.original_filename}"</strong>?
            <br /><br />
            This action will remove:
            • The imported file ({selectedImport?.file_size_formatted})
            • All {selectedImport?.rows_processed} processed records
            • Any modifications made to the data
            <br /><br />
            <strong>This action cannot be undone.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete File
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Editor Dialog */}
      {editorOpen && editingImport && (
        <DataEditor
          importId={editingImport.id}
          filename={editingImport.original_filename}
          onClose={handleEditorClose}
        />
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
          sx={{ minWidth: 300 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;