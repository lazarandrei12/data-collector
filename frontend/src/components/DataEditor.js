import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon
} from '@mui/icons-material';

const DataEditor = ({ importId, filename, onClose }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editData, setEditData] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    if (importId) {
      fetchRecords();
    }
  }, [importId]);

  const fetchRecords = async () => {
    try {
      const response = await fetch(`http://localhost/datacollector-api/api/data-manager.php?import_id=${importId}`);
      const result = await response.json();
      
      if (result.success) {
        setRecords(result.data);
        if (result.data.length > 0) {
          setHeaders(Object.keys(result.data[0].data || {}));
        }
      } else {
        showNotification('Error loading records: ' + result.error, 'error');
      }
    } catch (error) {
      showNotification('Error fetching records: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (record) => {
    setEditingRecord(record.id);
    setEditData({ ...record.data });
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch('http://localhost/datacollector-api/api/data-manager.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord,
          data: editData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Record updated successfully!', 'success');
        fetchRecords();
        setEditingRecord(null);
        setEditData({});
      } else {
        showNotification('Error updating record: ' + result.error, 'error');
      }
    } catch (error) {
      showNotification('Error saving changes: ' + error.message, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditData({});
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await fetch('http://localhost/datacollector-api/api/data-manager.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Record deleted successfully!', 'success');
        fetchRecords();
      } else {
        showNotification('Error deleting record: ' + result.error, 'error');
      }
    } catch (error) {
      showNotification('Error deleting record: ' + error.message, 'error');
    }
  };

  const handleAddRecord = async () => {
    const newRecord = {};
    headers.forEach(header => {
      newRecord[header] = '';
    });
    
    try {
      const response = await fetch('http://localhost/datacollector-api/api/data-manager.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          import_id: importId,
          data: newRecord
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('New record added successfully!', 'success');
        fetchRecords();
      } else {
        showNotification('Error adding record: ' + result.error, 'error');
      }
    } catch (error) {
      showNotification('Error adding record: ' + error.message, 'error');
    }
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRecords = records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Edit Data: {filename}
          </Typography>
          <Box>
            <Chip label={`${records.length} records`} color="primary" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRecord}
              sx={{ ml: 2 }}
            >
              Add Record
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Typography>Loading records...</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row #</TableCell>
                  {headers.map(header => (
                    <TableCell key={header}>{header}</TableCell>
                  ))}
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.row_number}</TableCell>
                    {headers.map(header => (
                      <TableCell key={header}>
                        {editingRecord === record.id ? (
                          <TextField
                            size="small"
                            value={editData[header] || ''}
                            onChange={(e) => setEditData({
                              ...editData,
                              [header]: e.target.value
                            })}
                          />
                        ) : (
                          <Typography variant="body2">
                            {record.data[header] || '—'}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      {record.is_modified ? (
                        <Chip label="Modified" color="warning" size="small" />
                      ) : (
                        <Chip label="Original" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRecord === record.id ? (
                        <Box>
                          <IconButton size="small" color="primary" onClick={handleSaveEdit}>
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" color="secondary" onClick={handleCancelEdit}>
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box>
                          <IconButton size="small" color="primary" onClick={() => handleEditClick(record)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteRecord(record.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={records.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default DataEditor;