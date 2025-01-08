import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Container, Paper, Box, Typography, IconButton } from '@mui/material';
import { Send as SendIcon, Mic as MicIcon, Menu as MenuIcon, Brightness4, Brightness7 } from '@mui/icons-material';

// Constants for chunking messages
const MAX_CHUNK_LENGTH = 200;

// Function to split text into smaller chunks
const splitTextIntoChunks = (text, maxLength) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);
    // Ensure we split at the end of a word, not in the middle
    if (end < text.length && text[end] !== ' ') {
      end = text.lastIndexOf(' ', end);
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
};

// Function to play audio sequentially
const playAudioSequentially = (audioUrl) => {
  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    audio.onended = resolve; // Resolve the promise when audio ends
    audio.play();
  });
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const MAX_CHUNK_LENGTH = 200;

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    localStorage.setItem("chatNames", JSON.stringify(chatNames));
    localStorage.setItem("currentChatId", currentChatId);
  }, [chatHistory, chatNames, currentChatId]);

  const getResponseFromNVIDIA = async (input, retries = 3) => {
    try {
      const response = await axios.post("http://localhost:5000/api/nvidia", {
        model: "meta/llama3-70b-instruct",
        messages: [{ role: "user", content: input }],
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
      });

      return response.data.choices[0]?.message?.content || "No response from AI.";
    } catch (error) {
      console.error("Error fetching AI response:", error.message);
      if (retries > 0) {
        console.log(`Retrying... (${3 - retries + 1}/${3})`);
        return getResponseFromNVIDIA(input, retries - 1);
      } else {
        return "Error fetching AI response after multiple attempts.";
      }
    }
  };

  const fetchVoiceFromSmallestAI = async (text) => {
    try {
      const options = {
        method: "POST",
        headers: {
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdiYmE0MGM0NDE1ODdhYjZlZTBhZjUiLCJ0eXBlIjoiYXBpS2V5IiwiaWF0IjoxNzM2MTYxODU2LCJleHAiOjQ4OTE5MjE4NTZ9.sQFZALV1ek5UTijIewITo64J851_byHjJ0y13ClkXX8",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voice_id: "emily",
          text: text,
          speed: 1,
          sample_rate: 24000,
          add_wav_header: true,
        }),
      };

      const response = await fetch("https://waves-api.smallest.ai/api/v1/lightning/get_speech", options);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch audio from Smallest AI:", errorData);
        return null;
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error with Smallest AI API:", error);
      return null;
    }
  };

  const playAudioSequentially = (audioUrl) =>
    new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.onended = resolve;
      audio.onerror = resolve;
      audio.play();
    });

  const speakResponse = async (text) => {
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_LENGTH);

    for (const chunk of chunks) {
      const audioUrl = await fetchVoiceFromSmallestAI(chunk);
      if (audioUrl) {
        await playAudioSequentially(audioUrl); // Play audio sequentially
      }
    }
  };

  // Function to handle listening to user input (speech recognition)
  const startListening = () => {
    setIsListening(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log('Listening...');
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setUserInput(speechResult);
      handleSendMessage();
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Stopped listening');
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <Container style={{ marginTop: "20px" }}>
      <Box display="flex" justifyContent="flex-start" alignItems="flex-start">
        {/* Chat History Section */}
        <Box
          style={{
            width: "30%", 
            maxHeight: "500px", 
            overflowY: "auto", 
            border: "1px solid #ccc", 
            borderRadius: "8px", 
            padding: "8px"
          }}
        >
          <Typography variant="h6" align="center">Chat History</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={createNewChat} 
            style={{ marginBottom: "8px" }}
          >
            New Chat
          </Button>
          <div className="history-item">Previous Chat 1</div>
          <div className="history-item">Previous Chat 2</div>
        </div>
      </div>

      <div className="main-content">
        <IconButton className="sidebar-toggle" onClick={toggleSidebar}>
          <MenuIcon />
        </IconButton>

        <Container className="chat-container">
          <Paper className="chat-paper">
            <Box className="messages-area">
              {messages.map((msg, index) => (
                <Box key={index} className={`message-wrapper ${msg.sender}`}>
                  <Paper className={`message-bubble ${msg.sender}`}>
                    <Typography>{msg.message}</Typography>
                  </Paper>
                </Box>
              ))}
            </Box>

            <Box className="input-area">
              <Box className="input-container">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type your message here..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={isListening}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  multiline
                  maxRows={4}
                  className="chat-input"
                />
                <Box className="button-group">
                  <Button
                    variant="contained"
                    onClick={isListening ? null : startListening}
                    disabled={isListening}
                    className="mic-button"
                  >
                    <MicIcon />
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isLoading || isListening || !userInput.trim()}
                    className="send-button"
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Container>
      </div>
    </div>
  );
  
};

export default ChatApp;
