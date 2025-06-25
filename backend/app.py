from flask import Flask, jsonify 
from flask_cors import CORS 
 
app = Flask(__name__) 
CORS(app)  # Pentru comunicare cu React 
 
@app.route('/') 
def home(): 
    return jsonify({ 
        'message': 'Data Collector Backend', 
        'status': 'running', 
        'version': '1.0.0' 
    }) 
 
@app.route('/api/test') 
def test(): 
    return jsonify({ 
        'data': 'Backend conexiune reu?ita!', 
        'backend': 'Flask', 
        'database': 'Ready for connection' 
    }) 
 
if __name__ == '__main__': 
    print('Data Collector Backend pornit pe http://localhost:5000') 
    app.run(debug=True, port=5000, host='0.0.0.0') 
