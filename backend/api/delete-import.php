<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Conexiune la baza de date
$serverName = "localhost\\SQLEXPRESS";
$database = "data_collector";
$username = "lazar";
$password = "1234";

try {
    $pdo = new PDO("sqlsrv:server=$serverName;Database=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        // Obține ID-ul din URL sau din body
        $input = json_decode(file_get_contents('php://input'), true);
        $importId = $input['id'] ?? $_GET['id'] ?? null;
        
        if (!$importId) {
            throw new Exception('Import ID is required');
        }
        
        // Găsește informațiile despre import
        $sql = "SELECT stored_filename, original_filename FROM file_imports WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$importId]);
        $import = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$import) {
            throw new Exception('Import not found');
        }
        
        // Șterge înregistrările individuale mai întâi
        $deleteSql = "DELETE FROM imported_records WHERE import_id = ?";
        $deleteStmt = $pdo->prepare($deleteSql);
        $deleteStmt->execute([$importId]);
        
        // Șterge fișierul fizic
        $filePath = '../uploads/' . $import['stored_filename'];
        if (file_exists($filePath)) {
            if (!unlink($filePath)) {
                // Log warning dar continuă cu ștergerea din DB
                error_log("Warning: Could not delete file: " . $filePath);
            }
        }
        
        // Șterge din baza de date
        $sql = "DELETE FROM file_imports WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([$importId]);
        
        if (!$result) {
            throw new Exception('Failed to delete from database');
        }
        
        // Log activitatea
        $logSql = "INSERT INTO logs (source_id, level, message, details) VALUES (?, ?, ?, ?)";
        $logStmt = $pdo->prepare($logSql);
        $logStmt->execute([
            null,
            'INFO',
            'File import deleted',
            json_encode([
                'import_id' => $importId,
                'filename' => $import['original_filename'],
                'stored_as' => $import['stored_filename']
            ])
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Import deleted successfully',
            'deleted_file' => $import['original_filename']
        ]);
        
    } catch (Exception $e) {
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
?>