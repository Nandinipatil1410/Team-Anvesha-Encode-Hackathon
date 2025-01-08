import React, { useState, useEffect } from "react";
import { Container, Button, TextField, Paper, Box, Typography, List, ListItem, ListItemText, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";

const productContext = `
You are a helpful assistant for [Your Business Name]. Here is information about our products:
- Smartwatch: A fitness tracker with heart rate monitoring and GPS.
- Wireless Earbuds: Noise-canceling earbuds with superior sound quality.
- Smart Home Speaker: A voice-controlled speaker with home automation features.
- Laptop: A high-performance laptop for professionals and gamers.
- Smartphone: A cutting-edge phone with the latest technology.
`;

const intents = [
  { pattern: /smartwatch/i, response: "Our smartwatch offers fitness tracking and GPS capabilities." },
  { pattern: /earbuds/i, response: "Our wireless earbuds provide noise cancellation and superior sound quality." },
  { pattern: /speaker/i, response: "Our smart home speaker helps automate your home with voice commands." },
  { pattern: /price/i, response: "200" },
  { pattern: /smartphone/i, response: "Our smartphone features the latest technology for a seamless experience." },
];

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
    return storedChatId || "Chat 1";
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

  useEffect(() => {
    // Greet the user when the chat app loads
    const greetUser = async () => {
      const greeting = "Hello! How can I assist you today?";
      const botMessage = { text: greeting, sender: "bot" };

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, botMessage];
        setChatHistory((prevHistory) => ({
          ...prevHistory,
          [currentChatId]: updatedMessages,
        }));
        return updatedMessages;
      });

      await speakResponse(greeting);
    };
    
    if (messages.length === 0) {
      greetUser();
    }
  }, [currentChatId, messages]);

  const matchIntent = (input) => {
    for (let intent of intents) {
      if (intent.pattern.test(input)) {
        return intent.response;
      }
    }
    return null;
  };

  const getResponseFromNVIDIA = async (input, retries = 3) => {
    try {
      const response = await axios.post("http://localhost:5000/api/nvidia", {
        model: "meta/llama3-70b-instruct",
        messages: [
          { role: "system", content: productContext },
          { role: "user", content: input },
        ],
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
      });

      return response.data.choices[0]?.message?.content || "No response from AI.";
    } catch (error) {
      console.error("Error fetching AI response:", error.message);
      if (retries > 0) {
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
          text,
          speed: 1,
          sample_rate: 24000,
          add_wav_header: true,
        }),
      };

      const response = await fetch("https://waves-api.smallest.ai/api/v1/lightning/get_speech", options);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch audio:", errorData);
        return null;
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error with Smallest AI API:", error);
      return null;
    }
  };

  const speakResponse = async (text) => {
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_LENGTH);
    for (const chunk of chunks) {
      const audioUrl = await fetchVoiceFromSmallestAI(chunk);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        await new Promise((resolve) => {
          audio.onended = resolve;
          audio.onerror = resolve;
          audio.play();
        });
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

    const intentResponse = matchIntent(userInput);
    const botResponse = intentResponse || (await getResponseFromNVIDIA(userInput));

    const botMessage = { text: botResponse, sender: "bot" };
    const updatedMessagesWithBot = [...updatedMessages, botMessage];

    setMessages(updatedMessagesWithBot);
    setChatHistory({
      ...chatHistory,
      [currentChatId]: updatedMessagesWithBot,
    });

    await speakResponse(botResponse);
  };

  // Creating a new chat
  const createNewChat = () => {
    const newChatId = `Chat ${Object.keys(chatHistory).length + 1}`;
    setChatHistory({
      ...chatHistory,
      [newChatId]: [],
    });
    setChatNames({
      ...chatNames,
      [newChatId]: `Chat ${Object.keys(chatHistory).length + 1}`,
    });
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  // Loading an existing chat
  const loadChat = (chatId) => {
    setCurrentChatId(chatId);
    setMessages(chatHistory[chatId] || []);
  };

  // Editing chat name
  const handleEditChatName = (chatId) => {
    const newName = prompt("Enter a new name for this chat:", chatNames[chatId]);
    if (newName) {
      setChatNames({
        ...chatNames,
        [chatId]: newName,
      });
    }
  };

  // Voice input logic using Web Speech API
  const startListening = () => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        handleSendMessage();
      };

      recognition.start();
    } else {
      console.error("Speech recognition is not supported in this browser.");
    }
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
