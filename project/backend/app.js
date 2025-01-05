const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();  // Load environment variables from .env file

const app = express();
const port = 5000;

// Enable CORS for React to interact with this backend
app.use(cors());

// Endpoint to make the call
app.get('/make-call', (req, res) => {
  const { toPhoneNumber } = req.query;

  if (!toPhoneNumber) {
    return res.status(400).send({ message: 'Missing phone number parameter' });
  }

  // Twilio credentials (from .env file)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const client = new twilio(accountSid, authToken);

  // Make the phone call
  client.calls.create({
    to: toPhoneNumber,  // Phone number passed from frontend
    from: fromPhoneNumber,  // Your Twilio phone number
    twiml: '<Response><Say voice="alice">Hello, this is a call from your Twilio application!</Say></Response>'
  })
  .then(call => {
    console.log(call.sid);
    res.send({ message: 'Call is being placed...', callSid: call.sid });
  })
  .catch(err => {
    console.error(err);
    res.status(500).send('Error making call');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
