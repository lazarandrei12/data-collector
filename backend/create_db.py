import mysql.connector 
 
try: 
    conn = mysql.connector.connect( 
        host='localhost', 
        port=3307, 
        user='root', 
        password='' 
    ) 
    cursor = conn.cursor() 
    cursor.execute("CREATE DATABASE IF NOT EXISTS data_collector") 
    print("? Baza 'data_collector' creata!") 
    conn.close() 
except Exception as e: 
    print(f"? Eroare: {e}") 
