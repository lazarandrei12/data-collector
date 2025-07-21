USE data_collector;

-- ?terge tabelele în ordinea corect? (de la copii la p?rin?i)
DROP TABLE IF EXISTS configs;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS collected_data;
DROP TABLE IF EXISTS file_imports;  -- Mut? aici
DROP TABLE IF EXISTS sources;

-- Creeaz? tabelele în ordinea corect?
CREATE TABLE sources (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    url_or_path NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'ACTIVE',
    last_sync DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE file_imports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    original_filename NVARCHAR(255) NOT NULL,
    stored_filename NVARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type NVARCHAR(50),
    status NVARCHAR(20) DEFAULT 'PENDING',
    rows_processed INT DEFAULT 0,
    rows_failed INT DEFAULT 0,
    imported_by NVARCHAR(100) DEFAULT 'system',
    import_started_at DATETIME2 DEFAULT GETDATE(),
    import_completed_at DATETIME2 NULL,
    error_message NVARCHAR(MAX) NULL,
    preview_data NVARCHAR(MAX) NULL
);

CREATE TABLE collected_data (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    source_id INT,
    data_content NVARCHAR(MAX),
    data_type NVARCHAR(20) DEFAULT 'JSON',
    record_count INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'NEW',
    collected_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    source_id INT,
    level NVARCHAR(10) DEFAULT 'INFO',
    message NVARCHAR(MAX),
    details NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE configs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    source_id INT,
    config_name NVARCHAR(100),
    config_value NVARCHAR(MAX),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

-- Insereaz? datele
INSERT INTO sources (name, type, url_or_path, status) VALUES 
('sales API', 'API', 'https://api.company.com/sales', 'ACTIVE'),
('Customer Files', 'FILE', '/data/customers/', 'ACTIVE'),
('Gmail Inbox', 'EMAIL', 'gmail_api', 'ACTIVE'),
('Web Scraper', 'WEB', 'https://example.com', 'INACTIVE');

INSERT INTO configs (source_id, config_name, config_value) VALUES 
(1, 'frequency_minutes', '60'),
(1, 'max_records', '1000'),
(2, 'file_pattern', '*.xlsx'),
(3, 'folder', 'INBOX');

INSERT INTO collected_data (source_id, data_content, data_type, record_count, status) VALUES 
(1, '{"sales": [{"id": 1, "amount": 1500}]}', 'JSON', 1, 'PROCESSED'),
(2, '{"customers": [{"name": "Ion", "email": "ion@test.com"}]}', 'JSON', 1, 'NEW'),
(3, '{"emails": [{"subject": "Test", "from": "test@email.com"}]}', 'JSON', 1, 'PROCESSED');

INSERT INTO logs (source_id, level, message, details) VALUES 
(1, 'INFO', 'Collection completed successfully', '{"records": 1, "time_ms": 1200}'),
(2, 'WARNING', 'File validation warning', '{"file": "customers.xlsx", "issue": "missing_column"}'),
(3, 'ERROR', 'Authentication failed', '{"error": "token_expired"}');

-- Verific? rezultatul
SELECT COUNT(*) as sources_count FROM sources;
SELECT COUNT(*) as file_imports_count FROM file_imports;

PRINT 'Database recreated successfully!';