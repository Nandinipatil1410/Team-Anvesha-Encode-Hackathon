import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Box } from '@mui/material';
import { Send as SendIcon, Mic as MicIcon } from '@mui/icons-material';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // Function to handle speech synthesis (Bot speaking)
  const speakResponse = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(speech);
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

  return (
    <Box display="flex" flexDirection="column" p={2} maxWidth="500px" margin="auto" mt={5}>
      <Box display="flex" flexDirection="column" mb={2} maxHeight="300px" overflow="auto">
        {messages.map((msg, index) => (
          <Box key={index} p={1} my={1} borderRadius="8px" bgcolor={msg.sender === 'user' ? 'lightblue' : 'lightgreen'}>
            <strong>{msg.sender === 'user' ? 'You: ' : 'Bot: '}</strong>{msg.message}
          </Box>
        ))}
      </Box>
      <TextField
        label="Say something..."
        variant="outlined"
        fullWidth
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        disabled={isListening}
        InputProps={{
          endAdornment: (
            <Button onClick={isListening ? null : startListening} variant="contained" color="primary">
              <MicIcon />
            </Button>
          ),
        }}
      />
      <Button
        variant="contained"
        color="secondary"
        onClick={handleSubmit}
        disabled={isLoading || isListening}
        endIcon={<SendIcon />}
        sx={{ mt: 2 }}
      >
        Send
      </Button>
    </Box>
  );
};

export default Chatbot;
