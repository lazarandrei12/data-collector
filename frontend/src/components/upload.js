import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const FileUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file input
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process file upload
  const handleFile = async (file) => {
    // Reset states
    setError(null);
    setUploadResult(null);
    setUploading(true);
    setUploadProgress(0);

    // Validate file
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.some(type => file.type === type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
      setError('Invalid file type. Please upload CSV, XLS, or XLSX files only.');
      setUploading(false);
      return;
    }

    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit.');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('http://localhost/datacollector-api/upload/upload.php', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (result.success) {
        setUploadResult(result);
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        sx={{
          p: 3,
          border: `2px dashed ${dragActive ? '#1976d2' : '#ccc'}`,
          borderRadius: 2,
          backgroundColor: dragActive ? '#f3f8ff' : '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#1976d2',
            backgroundColor: '#f8f9ff'
          }
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <Box textAlign="center">
          <CloudUploadIcon 
            sx={{ 
              fontSize: 48, 
              color: dragActive ? '#1976d2' : '#666',
              mb: 2 
            }} 
          />
          <Typography variant="h6" gutterBottom>
            {dragActive ? 'Drop your file here' : 'Upload Excel/CSV File'}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Drag and drop your file here, or click to browse
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Supported formats: CSV, XLS, XLSX (Max 10MB)
          </Typography>
          
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </Box>
      </Paper>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading and processing file...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {uploadProgress}% complete
          </Typography>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <IconButton size="small" onClick={() => setError(null)}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Success Result */}
      {uploadResult && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          action={
            <Box>
              <Button
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => setShowPreview(!showPreview)}
                sx={{ mr: 1 }}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <IconButton size="small" onClick={() => setUploadResult(null)}>
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
          }
        >
          <Box>
            <Typography variant="subtitle2">
              File uploaded successfully!
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<CheckCircleIcon />} 
                label={`${uploadResult.fileName}`} 
                size="small" 
                color="success" 
              />
              <Chip 
                label={`${uploadResult.rowCount} rows`} 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label={uploadResult.fileSize} 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </Box>
        </Alert>
      )}

      {/* Data Preview */}
      <Collapse in={showPreview && uploadResult}>
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Data Preview
          </Typography>
          
          {/* Headers */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Headers detected:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {uploadResult?.headers?.map((header, index) => (
                <Chip 
                  key={index} 
                  label={header} 
                  size="small" 
                  variant="outlined" 
                />
              ))}
            </Box>
          </Box>

          {/* Preview Table */}
          {uploadResult?.preview && uploadResult.preview.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {uploadResult.headers.map((header, index) => (
                      <TableCell key={index}>
                        <strong>{header}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadResult.preview.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {uploadResult.headers.map((header, colIndex) => (
                        <TableCell key={colIndex}>
                          {row[header] || '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            Showing first 5 rows of {uploadResult?.rowCount} total rows
          </Typography>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default FileUpload;