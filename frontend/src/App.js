import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatIndex, setCurrentChatIndex] = useState(null);
  const chatContainerRef = useRef(null);

  const fetchAIResponse = async (userMessage) => {
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error fetching AI response:", error);
      return "Sorry, I encountered an error.";
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    const aiResponse = await fetchAIResponse(input);
    setMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);

    const updatedChatHistory = [...chatHistory];
    if (currentChatIndex === null) {
      updatedChatHistory.push([{ sender: "user", text: input }, { sender: "ai", text: aiResponse }]);
    } else {
      updatedChatHistory[currentChatIndex].push({ sender: "user", text: input });
      updatedChatHistory[currentChatIndex].push({ sender: "ai", text: aiResponse });
    }
    setChatHistory(updatedChatHistory);
    localStorage.setItem("chatHistory", JSON.stringify(updatedChatHistory));

    if (speechEnabled) {
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDeleteChat = (index) => {
    const updatedChatHistory = chatHistory.filter((_, i) => i !== index);
    setChatHistory(updatedChatHistory);
    localStorage.setItem("chatHistory", JSON.stringify(updatedChatHistory));

    if (currentChatIndex === index) {
      setMessages([]);
      setCurrentChatIndex(null);
    }
  };

  const handleSpeechInput = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const loadChatHistory = () => {
    const storedHistory = localStorage.getItem("chatHistory");
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  };

  const handleOpenChat = (index) => {
    setCurrentChatIndex(index);
    setMessages(chatHistory[index]);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setCurrentChatIndex(null);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  return (
    <div className="chat-container">
      {/* Chat History Section */}
      <div className="history-section">
        <h3>Previous Chats</h3>
        {chatHistory.length === 0 ? (
          <p>No previous chats found.</p>
        ) : (
          <ul>
            {chatHistory.map((_, index) => (
              <li key={index} className="history-item">
                <span onClick={() => handleOpenChat(index)}>{`Chat ${index + 1}`}</span>
                <button
                  className="delete-chat-button"
                  onClick={() => handleDeleteChat(index)}
                  aria-label={`Delete Chat ${index + 1}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={handleNewChat} className="new-chat-button">
          New Chat
        </button>
      </div>

      {/* Main Chat Section */}
      <div className="chat-box-container">
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

        {/* Input Section */}
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="input-field"
            aria-label="Type your message"
          />
          <button type="button" onClick={handleSpeechInput} className="speech-button" aria-label="Speak">
            <span className="material-icons">mic</span> Speak
          </button>
          <button type="submit" className="send-button" aria-label="Send Message">
            Send
          </button>
        </form>

        <div className="controls">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className="speech-toggle-button"
            aria-label={speechEnabled ? "Disable Speech Output" : "Enable Speech Output"}
          >
            <span className="material-icons">
              {speechEnabled ? "volume_up" : "volume_off"}
            </span> {speechEnabled ? "Disable Speech" : "Enable Speech"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
