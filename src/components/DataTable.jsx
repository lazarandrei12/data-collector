import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  Chip,
  IconButton,
  Button
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

const DataTable = () => {
  // State pentru date și paginare
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Definirea coloanelor
  const columns = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { id: 'name', label: 'Connection Name', minWidth: 170 },
    { id: 'type', label: 'Type', minWidth: 100 },
    { id: 'status', label: 'Status', minWidth: 100 },
    { id: 'created_at', label: 'Created', minWidth: 150 },
    { id: 'actions', label: 'Actions', minWidth: 120 }
  ];

  // Fetch data din backend
  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/connections');
      const data = await response.json();
      setConnections(data.connections || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch connections');
      setLoading(false);
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Render status chip
  const renderStatus = (status) => {
    const color = status === 'active' ? 'success' : 'error';
    return <Chip label={status} color={color} size="small" />;
  };

  if (loading) return <Typography>Loading connections...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Header cu titlu și buton Add */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Data Connections
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => console.log('Add new connection')}
        >
          Add Connection
        </Button>
      </Box>

      {/* Table Container */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="data connections table">
            {/* Table Header */}
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* Table Body */}
            <TableBody>
              {connections
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((connection) => (
                  <TableRow hover key={connection.id}>
                    <TableCell>{connection.id}</TableCell>
                    <TableCell>{connection.name}</TableCell>
                    <TableCell>{connection.type}</TableCell>
                    <TableCell>{renderStatus(connection.status)}</TableCell>
                    <TableCell>{connection.created_at}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => console.log('Edit', connection.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => console.log('Delete', connection.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={connections.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default DataTable;