import React, { useState, useEffect, useRef } from "react";
import './App.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatIndex, setCurrentChatIndex] = useState(null);
  const chatContainerRef = useRef(null);

  // Fetch AI Response
  const fetchAIResponse = async (userMessage) => {
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      return data.response; // Assuming the API returns { response: "AI reply" }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      return "Sorry, I encountered an error.";
    }
  };

  // Scroll to the bottom of the chat container
  const scrollToBottom = () => {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  };

  // Handle User Input Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input) return;

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    const aiResponse = await fetchAIResponse(input);
    setMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);

    // Save the current conversation to chat history in localStorage
    const updatedChatHistory = [...chatHistory, { user: input, ai: aiResponse }];
    setChatHistory(updatedChatHistory);
    localStorage.setItem("chatHistory", JSON.stringify(updatedChatHistory));

    // Speak the AI response if enabled
    if (speechEnabled) {
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Handle Speech Input
  const handleSpeechInput = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  // Load Previous Chats from localStorage
  const loadChatHistory = () => {
    const storedHistory = localStorage.getItem("chatHistory");
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  };

  // Handle Opening Previous Chat
  const handleOpenChat = (index) => {
    setCurrentChatIndex(index);
    setMessages([]);
    const selectedChat = chatHistory[index];
    setMessages([
      { sender: "user", text: selectedChat.user },
      { sender: "ai", text: selectedChat.ai }
    ]);
  };

  // Start New Chat
  const handleNewChat = () => {
    if (messages.length > 0) {
      const updatedChatHistory = [...chatHistory, { user: messages[0].text, ai: messages[1].text }];
      setChatHistory(updatedChatHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedChatHistory));
    }
    setMessages([]);
    setInput("");
    setCurrentChatIndex(null);
  };

  // Effect to scroll chat to bottom on message change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  return (
    <div className="chat-container">
      {/* Chat History Section (Left Side) */}
      <div className="history-section">
        <h3>Previous Chats</h3>
        {chatHistory.length === 0 ? (
          <p>No previous chats found.</p>
        ) : (
          <ul>
            {chatHistory.map((chat, index) => (
              <li
                key={index}
                className="history-item"
                onClick={() => handleOpenChat(index)}
              >
                {`Chat ${index + 1}`}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main Chat Window (Right Side) */}
      <div ref={chatContainerRef} className="chat-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user-message" : "ai-message"}`}
          >
            <strong>{msg.sender === "user" ? "You" : "AI"}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="input-field"
        />
        <button
          type="button"
          onClick={handleSpeechInput}
          className="speech-button"
        >
          Speak
        </button>
        <button type="submit" className="send-button">
          Send
        </button>
      </form>

      <div className="controls">
        <button onClick={handleNewChat} className="new-chat-button">
          New Chat
        </button>
        <label>
          <input
            type="checkbox"
            checked={speechEnabled}
            onChange={() => setSpeechEnabled(!speechEnabled)}
            className="speech-checkbox"
          />
          Enable Speech Output
        </label>
      </div>
    </div>
  );
};

export default Chatbot;
