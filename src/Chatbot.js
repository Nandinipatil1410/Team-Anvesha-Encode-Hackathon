import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Container, Paper, Box, Typography, IconButton } from '@mui/material';
import { Send as SendIcon, Mic as MicIcon, Menu as MenuIcon, Brightness4, Brightness7 } from '@mui/icons-material';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Removed the line that speaks user input, so only bot responses will be spoken
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1].message;
      if (lastMessage && messages[messages.length - 1].sender === 'bot') {
        speakResponse(lastMessage);
      }
    }
  }, [messages]);

  // Function to handle sending user input and getting the AI response
  const handleSubmit = async () => {
    if (userInput.trim() === '') return;
    const newMessages = [...messages, { message: userInput, sender: 'user' }];
    setMessages(newMessages);
    setIsLoading(true);
    setUserInput('');

    try {
      const response = await getResponseFromHuggingFace(userInput);
      const botMessage = response[0]?.generated_text || 'Sorry, I didn’t understand that.';

      setMessages([...newMessages, { message: botMessage, sender: 'bot' }]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get response from Hugging Face API
  const getResponseFromHuggingFace = async (input) => {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill',
        { inputs: input },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGINGFACE_API_KEY}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return [{ generated_text: 'Sorry, there was an issue with my response.' }];
    }
  };

  // Function to fetch voice from Smallest AI and play the audio
  const fetchVoiceFromSmallestAI = async (text) => {
    try {
      const options = {
        method: 'POST',
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdiYmE0MGM0NDE1ODdhYjZlZTBhZjUiLCJ0eXBlIjoiYXBpS2V5IiwiaWF0IjoxNzM2MTYxODU2LCJleHAiOjQ4OTE5MjE4NTZ9.sQFZALV1ek5UTijIewITo64J851_byHjJ0y13ClkXX8', // Replace with your Smallest AI token
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_id: 'emily', // Choose the voice ID you want
          text: text,
          speed: 1,
          sample_rate: 24000,
          add_wav_header: true,
        }),
      };

      const response = await fetch('https://waves-api.smallest.ai/api/v1/lightning/get_speech', options);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch audio from Smallest AI:", errorData);
        return null;
      }

      // Handling the response as a Blob (audio file)
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob); // Create a URL for the Blob
      return audioUrl;
    } catch (error) {
      console.error("Error with Smallest AI API:", error);
      return null;
    }
  };

  // Function to handle speech synthesis (Bot speaking) using Smallest AI
  const speakResponse = async (text) => {
    const audioUrl = await fetchVoiceFromSmallestAI(text);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
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
      handleSubmit();
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Chat History</h2>
          <IconButton onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </div>
        <div className="chat-history">
          <Button variant="outlined" className="new-chat">
            + New Chat
          </Button>
          {/* Add chat history items here */}
          <div className="history-item">Previous Chat 1</div>
          <div className="history-item">Previous Chat 2</div>
        </div>
      </div>

      <div className="main-content">
        <IconButton 
          className="sidebar-toggle"
          onClick={toggleSidebar}
        >
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

export default Chatbot;
