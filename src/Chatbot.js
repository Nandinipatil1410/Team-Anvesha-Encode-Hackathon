import React, { useState, useEffect } from "react";
import { Container, Button, TextField, Paper, Box, Typography, List, ListItem, ListItemText, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";

const ChatApp = () => {
  const [chatHistory, setChatHistory] = useState(() => {
    const storedHistory = localStorage.getItem("chatHistory");
    return storedHistory ? JSON.parse(storedHistory) : {};
  });
  const [chatNames, setChatNames] = useState(() => {
    const storedNames = localStorage.getItem("chatNames");
    return storedNames ? JSON.parse(storedNames) : {};
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    const storedChatId = localStorage.getItem("currentChatId");
    return storedChatId || `Chat 1`;
  });
  const [messages, setMessages] = useState(chatHistory[currentChatId] || []);
  const [userInput, setUserInput] = useState("");
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
        await playAudioSequentially(audioUrl);
      }
    }
  };

  const splitTextIntoChunks = (text, maxLength) => {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      chunks.push(text.slice(start, start + maxLength));
      start += maxLength;
    }
    return chunks;
  };

  const handleSendMessage = async () => {
    if (userInput.trim() === "") return;

    const newMessage = { text: userInput, sender: "user" };
    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    setChatHistory({
      ...chatHistory,
      [currentChatId]: updatedMessages,
    });
    setUserInput("");

    const botResponse = await getResponseFromNVIDIA(userInput);
    const botMessage = { text: botResponse, sender: "bot" };

    const updatedMessagesWithBot = [...updatedMessages, botMessage];
    setMessages(updatedMessagesWithBot);
    setChatHistory({
      ...chatHistory,
      [currentChatId]: updatedMessagesWithBot,
    });

    await speakResponse(botResponse);
  };

  const createNewChat = () => {
    const newChatId = `Chat ${Object.keys(chatHistory).length + 1}`;
    setCurrentChatId(newChatId);
    setMessages([]);
    setChatHistory({
      ...chatHistory,
      [newChatId]: [],
    });
    setChatNames({
      ...chatNames,
      [newChatId]: newChatId,
    });
  };

  const loadChat = (chatId) => {
    setCurrentChatId(chatId);
    setMessages(chatHistory[chatId] || []);
  };

  const editChatName = (chatId, newName) => {
    setChatNames({
      ...chatNames,
      [chatId]: newName,
    });
  };

  const handleEditChatName = (chatId) => {
    const newName = prompt("Enter a new name for this chat:", chatNames[chatId] || chatId);
    if (newName) {
      editChatName(chatId, newName);
    }
  };

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
          <List>
            {Object.keys(chatHistory)
              .filter((chatId) => chatHistory[chatId].length > 0)
              .map((chatId) => (
                <ListItem
                  key={chatId}
                  selected={chatId === currentChatId}
                  onClick={() => loadChat(chatId)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    cursor: "pointer", 
                  }}
                  sx={{
                    "&:hover": {
                      backgroundColor: "#f4f4f4", 
                      transition: "background-color 0.3s ease", 
                    },
                  }}
                >
                  <ListItemText primary={chatNames[chatId] || chatId} />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditChatName(chatId);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
          </List>
        </Box>
  
        {/* Current Chat Section */}
        <Box
          style={{
            width: "70%", 
            marginLeft: "20px", 
            border: "1px solid #ccc", 
            borderRadius: "8px", 
            padding: "8px"
          }}
        >
          <Typography variant="h6" align="center">{chatNames[currentChatId] || currentChatId}</Typography>
          <Box style={{ maxHeight: "400px", overflowY: "auto", marginTop: "16px" }}>
            {messages.length > 0 ? (
              messages.filter((message) => message && message.text && message.sender)
                .map((message, index) => (
                  <Box key={index} style={{ marginBottom: "8px" }}>
                    <Typography style={{ textAlign: message.sender === "user" ? "right" : "left", color: message.sender === "user" ? "blue" : "green" }}>
                      {message.text}
                    </Typography>
                  </Box>
                ))
            ) : (
              <Typography variant="body2" color="textSecondary" align="center">No messages yet.</Typography>
            )}
          </Box>
  
          <Box display="flex" alignItems="center" marginTop="16px">
            <TextField 
              fullWidth 
              variant="outlined" 
              placeholder="Type your message..." 
              value={userInput} 
              onChange={(e) => setUserInput(e.target.value)} 
              onKeyPress={(e) => { if (e.key === "Enter") handleSendMessage(); }} 
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSendMessage} 
              style={{ marginLeft: "8px" }}
            >
              Send
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={startListening} 
              style={{ marginLeft: "8px" }} 
              disabled={isListening}
            >
              🎤
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
  
};

export default ChatApp;
