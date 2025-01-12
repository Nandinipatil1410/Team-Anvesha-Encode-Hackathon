import React, { useState, useEffect, useContext } from "react";
import { Container, Button, TextField, Paper, Box, Typography, List, ListItem, ListItemText, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";
import ReactMarkdown from "react-markdown"; 
import DeleteIcon from "@mui/icons-material/Delete"; // Import DeleteIcon
import { Drawer} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { ThemeContext } from './ThemeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Dark mode icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Light mode icon

const Header = ({ darkMode }) => {
  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '15px 20px',
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2c5364 100%)'
          : 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)',
        boxShadow: darkMode 
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        borderBottom: darkMode 
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <Typography 
        variant="h4" 
        style={{
          fontWeight: 'bold',
          color: darkMode ? '#f5f5f5' : '#121212',
          marginBottom: '4px',
          textShadow: darkMode 
            ? '2px 2px 4px rgba(0,0,0,0.5)'
            : '1px 1px 2px rgba(0,0,0,0.2)',
          letterSpacing: '1px'
        }}
      >
        SmartWatch AI
      </Typography>
      <Typography 
        variant="subtitle1" 
        style={{
          color: darkMode ? '#b3b3b3' : '#424242',
          fontStyle: 'italic',
          textShadow: darkMode 
            ? '1px 1px 2px rgba(0,0,0,0.5)'
            : '1px 1px 1px rgba(0,0,0,0.1)',
          letterSpacing: '0.5px'
        }}
      >
        Your Intelligent Shopping Assistant
      </Typography>
    </Box>
  );
};

const productContext = `You are a helpful assistant for [Your Business Name]. Here is information about our product:
- Smartwatch: A fitness tracker with heart rate monitoring, GPS, water resistance, long battery life, and device compatibility. Available with a 1-year warranty.`
;

const intents = [
  { pattern: /features/i, response: "Our smartwatch offers GPS tracking, heart rate monitoring, and long battery life." },
  { pattern: /gps/i, response: "Yes, our smartwatch includes GPS functionality for tracking your activities." },
  { pattern: /heart rate/i, response: "The smartwatch includes advanced heart rate monitoring for fitness tracking." },
  { pattern: /battery/i, response: "The smartwatch has a long-lasting battery that lasts up to 7 days on a single charge." },
  { pattern: /compatible/i, response: "The smartwatch is compatible with both iOS and Android devices." },
  { pattern: /water resistant|waterproof/i, response: "Yes, the smartwatch is water-resistant up to 50 meters." },
  { pattern: /warranty/i, response: "The smartwatch comes with a 1-year warranty." },
  { pattern: /price/i, response: "The smartwatch is available for $200." },
  { pattern: /availability/i, response: "The smartwatch is currently in stock and available for purchase on our website." },
  { pattern: /delivery/i, response: "We offer free delivery within 3-5 business days." },
  { pattern: /specifications|specs/i, response: "The smartwatch features a 1.5-inch AMOLED display, GPS, heart rate monitor, and water resistance." },
  { pattern: /connectivity/i, response: "The smartwatch supports Bluetooth 5.0 for seamless connectivity with your devices." },
  { pattern: /health tracking/i, response: "Our smartwatch includes health tracking features like step count, sleep tracking, and calorie monitoring." },
  { pattern: /steps/i, response: "The smartwatch tracks your daily step count to help you stay active." },
  { pattern: /sleep/i, response: "The smartwatch monitors your sleep patterns to give you insights into your sleep quality." },
  { pattern: /calories/i, response: "The smartwatch tracks calories burned during your workouts and daily activities." },
  { pattern: /color options|colors/i, response: "The smartwatch is available in black, silver, and rose gold." },
  { pattern: /return policy/i, response: "We offer a 30-day return policy if you're not satisfied with the smartwatch." },
  { pattern: /discount|offers/i, response: "We currently have a 10% discount on your first purchase!" },
  { pattern: /support/i, response: "For any issues or questions, you can reach out to our support team via email or phone." },
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const MAX_CHUNK_LENGTH = 200;

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    localStorage.setItem("chatNames", JSON.stringify(chatNames));
    localStorage.setItem("currentChatId", currentChatId);
  }, [chatHistory, chatNames, currentChatId]);

  useEffect(() => {
    // Greet the user when the chat app loads
    const greetUser = async () => {
      const greeting = "Hello there! 🌟 Are you ready to transform your daily routine with a smartwatch that’s not just smart, but life-changing?⌚✨ Let’s explore how it can redefine your day—shall we?";
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

  const stripMarkdown = (text) => {
    return text.replace(/[*_~>#-]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1");
  };
  
  const speakResponse = async (text) => {
    const strippedText = stripMarkdown(text);
    const chunks = splitTextIntoChunks(strippedText, MAX_CHUNK_LENGTH);
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

  const deleteChat = (chatId) => {
    const { [chatId]: deletedChat, ...remainingChats } = chatHistory;
    const { [chatId]: deletedName, ...remainingNames } = chatNames;
  
    setChatHistory(remainingChats);
    setChatNames(remainingNames);
  
    if (currentChatId === chatId) {
      const remainingChatIds = Object.keys(remainingChats);
      const newCurrentChatId = remainingChatIds.length > 0 ? remainingChatIds[0] : null;
      setCurrentChatId(newCurrentChatId);
      setMessages(newCurrentChatId ? remainingChats[newCurrentChatId] : []);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Container 
      style={{ 
        marginTop: "80px",
        padding: 0,
        backgroundColor: darkMode ? '#121212' : '#f5f5f5',
        minHeight: '100vh'
      }}
    >
      <Header darkMode={darkMode} />

      {/* Theme Toggle Button */}
      <IconButton 
        onClick={toggleTheme}
        style={{ 
          position: 'fixed', 
          right: 10, 
          top: 20,
          zIndex: 1100 
        }}
      >
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>

      {/* Hamburger Menu Button */}
      <IconButton 
        onClick={toggleDrawer}
        style={{ 
          position: 'fixed', 
          left: 10, 
          top: 20,
          zIndex: 1100,
          color: darkMode ? '#f5f5f5' : '#121212'
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Chat History Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        variant="temporary"
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#f5f5f5' : '#121212'
          }
        }}
      >
        <Box
          style={{
            width: "280px",
            height: "100%",
            padding: "16px",
            overflowY: "auto",
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
            "&::-webkit-scrollbar": {
              display: "none" // Chrome/Safari/Opera
            }
          }}
        >
          <Typography variant="h6" align="center">Chat History</Typography>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={createNewChat}
            style={{ margin: "16px 0" }}
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
                  onClick={() => {
                    loadChat(chatId);
                    toggleDrawer();
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
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
                  <Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditChatName(chatId);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chatId);
                      }}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
          </List>
        </Box>
      </Drawer>

      {/* Current Chat Section */}
      <Box
        style={{
          width: "100%",
          padding: "16px",
          marginLeft: "auto",
          marginRight: "auto",
          maxWidth: "1200px",
          color: darkMode ? '#f5f5f5' : '#121212'
        }}
      >
        <Box 
          style={{ 
            maxHeight: "calc(100vh - 200px)", 
            overflowY: "auto", 
            marginTop: "16px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": {
              display: "none"
            }
          }}
        >
          <Typography 
            variant="h6" 
            align="center" 
            style={{ 
              marginBottom: "20px",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
          >
            {chatNames[currentChatId] || currentChatId}
          </Typography>

          {messages.length > 0 ? (
            messages.filter((message) => message && message.text && message.sender)
              .map((message, index) => (
                <Box
                  key={index}
                  style={{
                    marginBottom: "8px",
                    textAlign: message.sender === "user" ? "right" : "left",
                  }}
                >
                  <Paper
                    style={{
                      display: "inline-block",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      backgroundColor: message.sender === "user" 
                        ? (darkMode ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)')
                        : (darkMode ? 'rgba(156, 39, 176, 0.15)' : 'rgba(156, 39, 176, 0.08)'),
                      color: message.sender === "user"
                        ? (darkMode ? '#90caf9' : '#1976d2')
                        : (darkMode ? '#e1bee7' : '#6a1b9a'),
                      maxWidth: "70%",
                      boxShadow: darkMode 
                        ? '0 2px 4px rgba(0,0,0,0.2)' 
                        : '0 2px 4px rgba(0,0,0,0.1)',
                      border: message.sender === "user"
                        ? (darkMode ? '1px solid rgba(25, 118, 210, 0.2)' : '1px solid rgba(25, 118, 210, 0.15)')
                        : (darkMode ? '1px solid rgba(156, 39, 176, 0.2)' : '1px solid rgba(156, 39, 176, 0.15)'),
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
                  >
                    {message.sender === "bot" ? (
                      <Typography 
                        component="div" 
                        style={{
                          fontSize: '0.95rem',
                          lineHeight: '1.5',
                          letterSpacing: '0.015em'
                        }}
                      >
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </Typography>
                    ) : (
                      <Typography 
                        style={{
                          fontSize: '0.95rem',
                          lineHeight: '1.5',
                          letterSpacing: '0.015em'
                        }}
                      >
                        {message.text}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              ))
          ) : (
            <Typography variant="body2" color="textSecondary" align="center">
              No messages yet.
            </Typography>
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
            sx={{
              backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: darkMode ? '#f5f5f5' : '#121212',
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? '#90caf9' : '#1976d2',
                },
              },
            }}
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
    </Container>
  );
};

export default ChatApp;