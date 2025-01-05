import React, { useState } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Function to initiate the call
  const initiateCall = async () => {
    if (!phoneNumber) {
      setStatus('Please enter a phone number');
      return;
    }

    try {
      setStatus('Placing the call...');
      const response = await fetch(`http://localhost:5000/make-call?toPhoneNumber=${phoneNumber}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('Call is being placed...');
      } else {
        setStatus('Error: ' + data.message);
      }
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <div className="App">
      <h1>Twilio Call Integration</h1>
      <input 
        type="text" 
        placeholder="Enter phone number" 
        value={phoneNumber} 
        onChange={(e) => setPhoneNumber(e.target.value)} 
      />
      <button onClick={initiateCall}>Make Call</button>
      <p>{status}</p>
    </div>
  );
}

export default App;
