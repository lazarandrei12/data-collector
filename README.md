# Data Collector 
 
## Advanced Data Collection and Integration Platform 
 
### Project Overview 
Multi-source data aggregation system with real-time synchronization, 
email integration, and intuitive web dashboard for enterprise data management. 
 
### Technology Stack 
- **Frontend:** React.js + Material-UI 
- **Backend:** Python Flask + SQLAlchemy   
- **Database:** MySQL (XAMPP), SQL Server support 
- **APIs:** Gmail API, Open APIs, Multi-database connectors 
- **Tools:** VSCode, Git, XAMPP, phpMyAdmin 
 
### Current Features 
- React-Flask-MySQL integration 
- RESTful API architecture 
- Database CRUD operations 
- CORS-enabled communication 
- Virtual environment setup 
- Multi-port database configuration 
 
### Planned Features 
- Gmail API integration for email data processing 
- CSV/Excel file import and export capabilities 
- Multi-database connectivity (SQL Server, PostgreSQL) 
- Real-time data synchronization between sources 
- Visual query builder interface 
- Advanced data analytics and reporting 
- Scheduled data collection tasks 
 
### Architecture 
```text 
React Frontend (Port 3000) 
      || 
   HTTP API 
      || 
Python Flask Backend (Port 5000) 
      || 
  SQL Queries 
      || 
MySQL Database (Port 3307) 
``` 
 
### Installation and Setup 
 
#### Prerequisites 
- Node.js (v16 or higher) 
- Python (v3.11 or higher) 
- XAMPP (for MySQL) 
- Git 
 
#### Frontend Setup 
```bash 
git clone https://github.com/lazarandrei12/data-collector.git 
cd data-collector 
npm install 
npm start 
``` 
 
#### Backend Setup 
```bash 
cd backend 
python -m venv venv 
venv\Scripts\activate 
pip install -r requirements.txt 
python app_mysql.py 
``` 
 
#### Database Setup 
1. Start XAMPP and enable Apache + MySQL 
2. Configure MySQL to run on port 3307 
3. Access phpMyAdmin at http://localhost/phpmyadmin 
4. Create database named 'data_collector' 
5. Run backend to create initial tables 
 
### API Endpoints 
- `GET /` - Backend status and configuration 
- `GET /api/test-connection` - Database connectivity test 
- `GET /api/create-tables` - Initialize database tables 
- `GET /api/connections` - Retrieve all data connections 
- `POST /api/connections` - Add new data connection 
 
### Development Status 
This project is currently in active development as part of Nokia internship program. 
Expected completion: July 2025 
 
### Contributing 
This is an educational project. Contributions and suggestions are welcome. 
 
### License 
This project is created for educational purposes. 
