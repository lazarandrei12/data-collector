import React from 'react';
import './App.css';
import Navigation from './components/Navigation';
import DataTable from './components/DataTable';

function App() {
  return (
    <div className="App">
      <Navigation />
      <main>
        <DataTable />
      </main>
    </div>
  );
}

export default App;