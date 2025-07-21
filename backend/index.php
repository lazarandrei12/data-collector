<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'message' => 'Data Collector API',
    'version' => '1.0.0',
    'status' => 'running',
    'endpoints' => [
        'sources' => '/api/sources.php',
        'test' => '/test_connection.php'
    ]
]);
?>