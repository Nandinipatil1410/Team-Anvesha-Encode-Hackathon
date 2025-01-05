import React, { useState } from "react";
import styled from "styled-components";

// Array of phone numbers to simulate calling
const phoneNumbers = [
  "+12345678901",
  "+12345678902",
  "+12345678903",
  "+12345678904",
  "+12345678905",
];

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState(0);
  const [callStatus, setCallStatus] = useState("");

  const handleMakeCalls = () => {
    setIsCalling(true);
    setCallStatus(`Calling: ${phoneNumbers[currentCallIndex]}`);

    // Simulate calling each number in the array
    simulateCall(currentCallIndex);
  };

  const simulateCall = (index) => {
    if (index < phoneNumbers.length) {
      setTimeout(() => {
        alert(`Simulating call to: ${phoneNumbers[index]}`);
        setCurrentCallIndex(index + 1);
        setCallStatus(`Calling: ${phoneNumbers[index + 1] || "No more calls to make"}`);
        simulateCall(index + 1);
      }, 3000); // Simulate call delay of 3 seconds
    } else {
      setIsCalling(false);
      setCallStatus("All calls completed.");
    }
  };

  return (
    <AppContainer>
      <Heading>AI Phone Agent</Heading>

      <Section>
        <h2>Simulate Calling Phone Numbers</h2>
        <Button onClick={handleMakeCalls} disabled={isCalling}>
          {isCalling ? "Calling..." : "Start Calls"}
        </Button>
        <CallStatus>{callStatus}</CallStatus>
      </Section>
    </AppContainer>
  );
};

export default App;

// Styled components for the UI

const AppContainer = styled.div`
  font-family: 'Arial', sans-serif;
  background-color: #f3f4f6;
  color: #333;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const Heading = styled.h1`
  font-size: 3rem;
  color: #0073e6;
  margin-bottom: 20px;
  text-align: center;
`;

const Section = styled.div`
  margin: 20px 0;
  width: 100%;
  max-width: 600px;
  text-align: center;
`;

const Button = styled.button`
  background-color: #0073e6;
  color: #fff;
  font-size: 1.2rem;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #005bb5;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const CallStatus = styled.p`
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-top: 10px;
  transition: color 0.3s ease;
`;
