 
@app.route('/api/test-connection') 
def test_connection(): 
    try: 
        engine = get_mysql_engine() 
        with engine.connect() as conn: 
            result = conn.execute(text("SELECT VERSION(), NOW()")) 
            version, now = result.fetchone() 
            return jsonify({ 
                'endpoint': 'TEST-CONNECTION', 
                'status': 'success', 
                'database': 'MySQL', 
                'version': version, 
                'timestamp': str(now) 
            }) 
    except Exception as e: 
        return jsonify({'endpoint': 'TEST-CONNECTION', 'status': 'error', 'message': str(e)}), 500 
 
@app.route('/api/create-tables') 
def create_tables(): 
    try: 
        engine = get_mysql_engine() 
        with engine.connect() as conn: 
            conn.execute(text('''CREATE TABLE IF NOT EXISTS connections ( 
                id INT AUTO_INCREMENT PRIMARY KEY, 
                name VARCHAR(100) NOT NULL, 
                type VARCHAR(50) NOT NULL, 
                status VARCHAR(20) DEFAULT 'active', 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
            )''')) 
            conn.commit() 
            return jsonify({'endpoint': 'CREATE-TABLES', 'status': 'success', 'message': 'Tabele create!'}) 
    except Exception as e: 
        return jsonify({'endpoint': 'CREATE-TABLES', 'status': 'error', 'message': str(e)}), 500 
 
@app.route('/api/connections') 
def get_connections(): 
    return jsonify({'endpoint': 'CONNECTIONS', 'message': 'Lista conexiuni', 'connections': []}) 
 
if __name__ == '__main__': 
    print('?? Data Collector Backend cu MySQL pornit pe http://localhost:5000') 
    app.run(debug=True, port=5000, host='0.0.0.0') 
