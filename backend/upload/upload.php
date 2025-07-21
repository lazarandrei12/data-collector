<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Conexiune directă la baza de date
$serverName = "localhost\\SQLEXPRESS";
$database = "data_collector";
$username = "lazar";
$password = "1234";

try {
    $pdo = new PDO("sqlsrv:server=$serverName;Database=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]));
}

// Configuration
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('UPLOAD_DIR', '../uploads/');
define('ALLOWED_TYPES', ['csv', 'xls', 'xlsx']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Validate file upload
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('No file uploaded or upload error occurred');
        }

        $file = $_FILES['file'];
        $originalName = $file['name'];
        $tmpName = $file['tmp_name'];
        $fileSize = $file['size'];
        
        // Security validations
        validateFile($file);
        
        // Create upload directory if not exists
        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }
        
        // Generate secure filename
        $fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $storedName = 'import_' . time() . '_' . uniqid() . '.' . $fileExtension;
        $uploadPath = UPLOAD_DIR . $storedName;
        
        // Move uploaded file
        if (!move_uploaded_file($tmpName, $uploadPath)) {
            throw new Exception('Failed to save uploaded file');
        }
        
        // Process file and get preview
        $processResult = processFile($uploadPath, $fileExtension);
        
        // Save to database
        $importId = saveImportRecord($pdo, $originalName, $storedName, $fileSize, $fileExtension, $processResult);
        
        // Save individual records for editing capability
        saveIndividualRecords($pdo, $importId, $processResult);
        
        // Return success response
        echo json_encode([
            'success' => true,
            'importId' => $importId,
            'fileName' => $originalName,
            'fileSize' => formatFileSize($fileSize),
            'rowCount' => $processResult['rowCount'],
            'headers' => $processResult['headers'],
            'preview' => $processResult['preview'],
            'message' => 'File uploaded and processed successfully'
        ]);
        
    } catch (Exception $e) {
        // Clean up uploaded file if exists
        if (isset($uploadPath) && file_exists($uploadPath)) {
            unlink($uploadPath);
        }
        
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
}

function validateFile($file) {
    $originalName = $file['name'];
    $fileSize = $file['size'];
    $tmpName = $file['tmp_name'];
    
    // Check file size
    if ($fileSize > MAX_FILE_SIZE) {
        throw new Exception('File size exceeds maximum allowed size of ' . formatFileSize(MAX_FILE_SIZE));
    }
    
    // Check file extension
    $fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($fileExtension, ALLOWED_TYPES)) {
        throw new Exception('File type not allowed. Allowed types: ' . implode(', ', ALLOWED_TYPES));
    }
    
    // Check if file is actually readable
    if (!is_readable($tmpName)) {
        throw new Exception('File is not readable');
    }
}

function processFile($filePath, $extension) {
    switch ($extension) {
        case 'csv':
            return processCSV($filePath);
        case 'xls':
        case 'xlsx':
            // Pentru săptămâna 2 vom implementa Excel
            throw new Exception('Excel processing will be implemented soon. Please convert to CSV for now.');
        default:
            throw new Exception('Unsupported file format');
    }
}

function processCSV($filePath) {
    $allData = [];
    $headers = [];
    $rowCount = 0;
    
    if (($handle = fopen($filePath, "r")) === FALSE) {
        throw new Exception('Cannot open CSV file');
    }
    
    // Read headers
    $headers = fgetcsv($handle);
    if ($headers === FALSE) {
        fclose($handle);
        throw new Exception('Cannot read CSV headers');
    }
    
    // Clean headers (remove BOM and trim)
    $headers = array_map(function($header) {
        return trim(str_replace("\xEF\xBB\xBF", '', $header));
    }, $headers);
    
    // Read ALL data rows (not just preview)
    while (($row = fgetcsv($handle)) !== FALSE) {
        if (count($row) === count($headers)) {
            $cleanRow = array_map('trim', $row);
            $combinedRow = array_combine($headers, $cleanRow);
            $allData[] = $combinedRow;
            $rowCount++;
        }
    }
    
    fclose($handle);
    
    return [
        'rowCount' => $rowCount,
        'headers' => $headers,
        'preview' => array_slice($allData, 0, 5), // First 5 rows for preview
        'data' => $allData, // ALL data for saving to database
        'processed' => true
    ];
}

function saveImportRecord($pdo, $originalName, $storedName, $fileSize, $fileType, $processResult) {
    try {
        $sql = "INSERT INTO file_imports (
            original_filename, 
            stored_filename, 
            file_size, 
            file_type, 
            status, 
            rows_processed, 
            preview_data,
            import_completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $originalName,
            $storedName,
            $fileSize,
            $fileType,
            'PROCESSED',
            $processResult['rowCount'],
            json_encode($processResult['preview'])
        ]);
        
        if (!$result) {
            throw new Exception('Failed to insert into database');
        }
        
        return $pdo->lastInsertId();
        
    } catch (Exception $e) {
        throw new Exception('Database save failed: ' . $e->getMessage());
    }
}

function saveIndividualRecords($pdo, $importId, $processResult) {
    try {
        if (!isset($processResult['data']) || empty($processResult['data'])) {
            return; // No data to save
        }
        
        $sql = "INSERT INTO imported_records (import_id, row_number, data_json) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        foreach ($processResult['data'] as $index => $row) {
            $stmt->execute([
                $importId,
                $index + 1, // row_number starts from 1
                json_encode($row)
            ]);
        }
        
        return true;
    } catch (Exception $e) {
        throw new Exception('Failed to save individual records: ' . $e->getMessage());
    }
}

function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}
?>