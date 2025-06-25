from flask import Flask, jsonify, request 
from flask_cors import CORS 
from sqlalchemy import create_engine, text 
from config import Config 
 
app = Flask(__name__) 
CORS(app) 
 
def get_mysql_engine(): 
    config = Config.MYSQL_CONFIG 
    connection_string = f"mysql+pymysql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}" 
    return create_engine(connection_string) 
 
@app.route('/') 
def home(): 
    return jsonify({ 
        'message': 'Data Collector Backend', 
        'status': 'running', 
        'database': 'MySQL (XAMPP)', 
        'port': Config.MYSQL_CONFIG['port'] 
    }) 
 
@app.route('/api/test-connection') 
def test_connection(): 
    try: 
        engine = get_mysql_engine() 
        with engine.connect() as conn: 
            result = conn.execute(text("SELECT VERSION(), NOW()")) 
            version, now = result.fetchone() 
            return jsonify({ 
                'status': 'success', 
                'database': 'MySQL', 
                'version': version, 
                'timestamp': str(now) 
            }) 
    except Exception as e: 
        return jsonify({'status': 'error', 'message': str(e)}), 500 
 
@app.route('/api/create-tables') 
def create_tables(): 
    try: 
        engine = get_mysql_engine() 
        with engine.connect() as conn: 
            # Creeaza tabela pentru conexiuni 
            conn.execute(text('''CREATE TABLE IF NOT EXISTS connections ( 
                id INT AUTO_INCREMENT PRIMARY KEY, 
                name VARCHAR(100) NOT NULL, 
                type VARCHAR(50) NOT NULL, 
                status VARCHAR(20) DEFAULT 'active', 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
            )''')) 
            # Creeaza tabela pentru surse de date 
            conn.execute(text('''CREATE TABLE IF NOT EXISTS data_sources ( 
                id INT AUTO_INCREMENT PRIMARY KEY, 
                source_name VARCHAR(100) NOT NULL, 
                connection_id INT, 
                last_sync TIMESTAMP NULL, 
                FOREIGN KEY (connection_id) REFERENCES connections(id) 
            )''')) 
            conn.commit() 
            return jsonify({'status': 'success', 'message': 'Tabele create cu succes!'}) 
    except Exception as e: 
        return jsonify({'status': 'error', 'message': str(e)}), 500 
 
@app.route('/api/connections') 
def get_connections(): 
    try: 
        engine = get_mysql_engine() 
        with engine.connect() as conn: 
            result = conn.execute(text("SELECT * FROM connections ORDER BY created_at DESC")) 
            connections = [] 
            for row in result: 
                connections.append({ 
                    'id': row[0], 
                    'name': row[1], 
                    'type': row[2], 
                    'status': row[3], 
                    'created_at': str(row[4]) 
                }) 
            return jsonify({'connections': connections, 'count': len(connections)}) 
    except Exception as e: 
        return jsonify({'status': 'error', 'message': str(e)}), 500 
    
@app.route('/api/add-sample-data')
def add_sample_data():
    try:
        engine = get_mysql_engine()
        with engine.connect() as conn:
           
            sample_data = [
                ('UNU', 'MySQL', 'active'),
                ('DOI', 'MSSQL', 'inactive'), 
                ('TREI', 'MYSQL', 'active'),
                ('PATRU', 'MSSQL', 'active')
            ]
            
            for name, type_val, status in sample_data:
                conn.execute(text("""
                    INSERT INTO connections (name, type, status) 
                    VALUES (:name, :type, :status)
                """), {'name': name, 'type': type_val, 'status': status})
            
           
            return jsonify({'status': 'success', 'message': 'Sample data added!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__': 
    print('?? Data Collector Backend cu MySQL pornit pe http://localhost:5000') 
    app.run(debug=True, port=5000, host='0.0.0.0') 

