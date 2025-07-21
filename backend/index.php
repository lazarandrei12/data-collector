<?php
header('Content-Type: application/json');

echo json_encode([
    'message' => 'Data Collector API',
    'version' => '1.0.0',
    'status' => 'running',
    'endpoints' => [
        'sources' => '/api/sources.php',
        'file_imports' => '/api/file-imports.php',
        'upload' => '/upload/upload.php',
        'delete_import' => '/api/delete-import.php'  // NOU
    ]
]);
?>