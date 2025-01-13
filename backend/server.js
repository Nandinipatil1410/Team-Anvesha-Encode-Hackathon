const express = require('express');
const axios = require('axios');
require('dotenv').config(); // For securely storing API keys
const cors = require('cors'); // Import the cors package

const app = express();
const PORT = 5000; // Port where the proxy will run

// Use CORS to allow requests from the frontend (localhost:3000)
app.use(cors({ origin: 'https://team-anvesha-encode-hackathon.vercel.app/' }));

// Middleware to parse JSON requests
app.use(express.json());

// Root route to handle GET requests
app.get('/', (req, res) => {
  res.send('Welcome to the NVIDIA API Proxy! Use POST /api/nvidia to interact with the API.');
});

// NVIDIA API Proxy Route
app.post('/api/nvidia', async (req, res) => {
  const { model, messages, temperature, top_p, max_tokens } = req.body;

  try {
    const response = await axios.post(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        top_p,
        max_tokens,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer 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`, // Use environment variable for security
          'Content-Type': 'application/json',
        },
      }
    );

    // Send the response back to the frontend
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error communicating with NVIDIA API:', error.message);
    res.status(500).json({ error: 'Error calling NVIDIA API' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
