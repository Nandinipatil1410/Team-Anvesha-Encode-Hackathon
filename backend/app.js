const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize the express app
const app = express();
const port = 5000;  // Backend will run on port 5000

// Middleware setup
app.use(cors());  // Enable CORS for frontend to communicate
app.use(bodyParser.json());  // Parse JSON bodies

// Simulated AI Response (can be replaced with actual AI service)
const getAIResponse = async (userMessage) => {
  // You can replace this with an actual API call (e.g., OpenAI, Dialogflow)
  const aiResponses = [
    "Hello! How can I assist you today?",
    "I'm an AI chatbot, nice to meet you!",
    "Sorry, I didn't understand that. Could you please rephrase?",
    "That's an interesting question! Let me think..."
  ];
  return aiResponses[Math.floor(Math.random() * aiResponses.length)];
};

// Handle chat requests
app.post('/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const aiResponse = await getAIResponse(message);  // Get AI's response
    res.json({ response: aiResponse });  // Send AI's response back
  } catch (error) {
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
