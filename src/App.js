import React from 'react';
import './App.css';
import Navigation from './components/Navigation';

function App() {
  return (
    <div className="App">
      <Navigation />
      <main style={{ padding: '20px' }}>
        <h2> Data Collector</h2>
        <p>Dashboard content will go here...</p>
      </main>
    </div>
  );
}

export default App;