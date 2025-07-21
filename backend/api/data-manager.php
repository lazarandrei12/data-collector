<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRecords($pdo);
        break;
    case 'POST':
        handleCreateRecord($pdo);
        break;
    case 'PUT':
        handleUpdateRecord($pdo);
        break;
    case 'DELETE':
        handleDeleteRecord($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

function handleGetRecords($pdo) {
    try {
        $importId = $_GET['import_id'] ?? null;
        
        if (!$importId) {
            throw new Exception('Import ID is required');
        }
        
        $sql = "SELECT 
            ir.id, 
            ir.row_number, 
            ir.data_json, 
            ir.is_deleted, 
            ir.is_modified,
            ir.created_at,
            ir.modified_at,
            fi.original_filename
        FROM imported_records ir
        JOIN file_imports fi ON ir.import_id = fi.id
        WHERE ir.import_id = ? AND ir.is_deleted = 0
        ORDER BY ir.row_number";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$importId]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decodează JSON pentru fiecare record
        foreach ($records as &$record) {
            $record['data'] = json_decode($record['data_json'], true);
        }
        
        echo json_encode([
            'success' => true,
            'data' => $records,
            'total' => count($records)
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleUpdateRecord($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $recordId = $input['id'] ?? null;
        $newData = $input['data'] ?? null;
        
        if (!$recordId || !$newData) {
            throw new Exception('Record ID and data are required');
        }
        
        // Validează că există înregistrarea
        $checkSql = "SELECT id FROM imported_records WHERE id = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$recordId]);
        if (!$checkStmt->fetch()) {
            throw new Exception('Record not found');
        }
        
        // Actualizează înregistrarea
        $sql = "UPDATE imported_records 
                SET data_json = ?, 
                    is_modified = 1, 
                    modified_at = GETDATE() 
                WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([json_encode($newData), $recordId]);
        
        if (!$result) {
            throw new Exception('Failed to update record');
        }
        
        // Log activitatea
        logActivity($pdo, null, 'INFO', 'Record updated', [
            'record_id' => $recordId,
            'action' => 'update'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Record updated successfully'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleDeleteRecord($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $recordId = $input['id'] ?? null;
        
        if (!$recordId) {
            throw new Exception('Record ID is required');
        }
        
        // Soft delete - marchează ca șters în loc să șteargă fizic
        $sql = "UPDATE imported_records 
                SET is_deleted = 1, 
                    modified_at = GETDATE() 
                WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([$recordId]);
        
        if (!$result) {
            throw new Exception('Failed to delete record');
        }
        
        // Log activitatea
        logActivity($pdo, null, 'INFO', 'Record deleted', [
            'record_id' => $recordId,
            'action' => 'soft_delete'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Record deleted successfully'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleCreateRecord($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $importId = $input['import_id'] ?? null;
        $data = $input['data'] ?? null;
        
        if (!$importId || !$data) {
            throw new Exception('Import ID and data are required');
        }
        
        // Găsește următorul row_number
        $rowSql = "SELECT ISNULL(MAX(row_number), 0) + 1 as next_row FROM imported_records WHERE import_id = ?";
        $rowStmt = $pdo->prepare($rowSql);
        $rowStmt->execute([$importId]);
        $nextRow = $rowStmt->fetch()['next_row'];
        
        // Inserează noul record
        $sql = "INSERT INTO imported_records (import_id, row_number, data_json) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([$importId, $nextRow, json_encode($data)]);
        
        if (!$result) {
            throw new Exception('Failed to create record');
        }
        
        $newId = $pdo->lastInsertId();
        
        // Log activitatea
        logActivity($pdo, null, 'INFO', 'Record created', [
            'record_id' => $newId,
            'import_id' => $importId,
            'action' => 'create'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Record created successfully',
            'id' => $newId
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function logActivity($pdo, $sourceId, $level, $message, $details = null) {
    try {
        $sql = "INSERT INTO logs (source_id, level, message, details) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$sourceId, $level, $message, json_encode($details)]);
    } catch (Exception $e) {
        // Ignore logging errors
    }
}
?>