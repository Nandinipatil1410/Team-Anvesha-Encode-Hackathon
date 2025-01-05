import React from 'react';
import ReactDOM from 'react-dom/client'; // Import from 'react-dom/client' for React 18+
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Use createRoot API instead of render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optionally you can still call reportWebVitals if needed
reportWebVitals();
