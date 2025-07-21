<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$serverName = "localhost\\SQLEXPRESS";
$database = "data_collector";
$username = "lazar";
$password = "1234";

try {
    $pdo = new PDO("sqlsrv:server=$serverName;Database=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = "SELECT id, name, type, status, last_sync FROM sources ORDER BY created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $sources,
        'source' => 'sql_server_real_data',
        'count' => count($sources)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => 'SQL Server connection failed'
    ]);
}
?>