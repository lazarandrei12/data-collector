<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Conexiune directă la baza de date (la fel ca în sources.php)
$serverName = "localhost\\SQLEXPRESS";
$database = "data_collector";
$username = "lazar";
$password = "1234";

try {
    $pdo = new PDO("sqlsrv:server=$serverName;Database=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = "SELECT 
        id,
        original_filename,
        file_size,
        file_type,
        status,
        rows_processed,
        rows_failed,
        import_started_at,
        import_completed_at,
        error_message
    FROM file_imports 
    ORDER BY import_started_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $imports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format data for frontend
    foreach ($imports as &$import) {
        $import['file_size_formatted'] = formatFileSize($import['file_size']);
        // Format date for display
        if ($import['import_started_at']) {
            $import['import_started_at'] = date('Y-m-d H:i:s', strtotime($import['import_started_at']));
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $imports,
        'total' => count($imports),
        'debug' => 'Found ' . count($imports) . ' imports'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => 'Database connection or query failed'
    ]);
}

function formatFileSize($bytes) {
    if ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}
?>