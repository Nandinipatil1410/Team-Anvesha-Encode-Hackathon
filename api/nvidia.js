const axios = require('axios');

export default async function handler(req, res) {
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
                        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`, // Store key securely in Vercel
                        'Content-Type': 'application/json',
                    },
                }
            );

            res.status(200).json(response.data);
        } catch (error) {
            console.error('Error communicating with NVIDIA API:', error.message);
            res.status(500).json({ error: 'Error calling NVIDIA API' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
