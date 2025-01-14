const axios = require('axios');

const NVIDIA_API_KEY = process.env.REACT_APP_NVIDIA_API_KEY;
// This function will be triggered when a POST request is made to /api/nvidia
module.exports = async (req, res) => {
  if (req.method === 'POST') {
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
            Authorization: `Bearer ${NVIDIA_API_KEY}`, // Store API Key in .env
            'Content-Type': 'application/json',
          },
        }
      );

      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error communicating with NVIDIA API:', error.message);
      return res.status(500).json({ error: 'Error calling NVIDIA API' });
    }
  } else {
    // Handle non-POST requests
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
};
