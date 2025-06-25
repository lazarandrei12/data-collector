from sqlalchemy import create_engine, text
from config import Config

def test_mysql_connection():
    try:
        config = Config.MYSQL_CONFIG
        connection_string = f"mysql+pymysql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
        engine = create_engine(connection_string)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION()"))
            version = result.fetchone()[0]
            print(" MySQL conectat cu succes!")
            print(f"Versiune: {version}")
        return True
    except Exception as e:
        print(f" Eroare conectare MySQL: {e}")
        return False

if __name__ == '__main__':
    test_mysql_connection()
