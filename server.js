const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle incoming calls from Twilio
app.post('/ivr/welcome', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say('Welcome to Aarogyam. Please enter your 14 digit ABHA ID followed by the hash key.');
  twiml.gather({
    numDigits: 14,
    action: '/ivr/handle-abha-id',
    method: 'POST',
  });
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle the ABHA ID input
app.post('/ivr/handle-abha-id', (req, res) => {
  const abhaId = req.body.Digits;
  const twiml = new twilio.twiml.VoiceResponse();

  // TODO: Validate the ABHA ID and fetch patient data

  twiml.say(`Thank you. You have entered ${abhaId}.`);
  twiml.say('Press 1 to listen to your latest prescription. Press 2 to listen to your emergency medical information.');
  twiml.gather({
    numDigits: 1,
    action: `/ivr/handle-menu-selection?abhaId=${abhaId}`,
    method: 'POST',
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

const prescriptions = [
    {
      id: 1,
      doctor: 'Dr. Priya Sharma',
      date: '2024-09-16',
      status: 'Active',
      medications: [
        {
          name: 'Paracetamol 500mg',
          dosage: '1 tablet',
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'After meals',
          remaining: 3
        },
        {
          name: 'Cetirizine 10mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '7 days',
          instructions: 'Before bedtime',
          remaining: 5
        }
      ]
    },
    {
      id: 2,
      doctor: 'Dr. Rajesh Kumar',
      date: '2024-09-10',
      status: 'Active',
      medications: [
        {
          name: 'Amlodipine 5mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: 'Ongoing',
          instructions: 'Morning, with water',
          remaining: 25
        }
      ]
    },
    {
      id: 3,
      doctor: 'Dr. Sunita Verma',
      date: '2024-09-05',
      status: 'Completed',
      medications: [
        {
          name: 'Hydrocortisone Cream',
          dosage: 'Apply thin layer',
          frequency: 'Twice daily',
          duration: '10 days',
          instructions: 'On affected area only',
          remaining: 0
        },
        {
          name: 'Loratadine 10mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '15 days',
          instructions: 'With or without food',
          remaining: 0
        }
      ]
    },
    {
      id: 4,
      doctor: 'Dr. Amit Patel',
      date: '2024-08-28',
      status: 'Active',
      medications: [
        {
          name: 'Ibuprofen 400mg',
          dosage: '1 tablet',
          frequency: 'Three times daily',
          duration: '7 days',
          instructions: 'After meals only',
          remaining: 12
        },
        {
          name: 'Calcium + Vitamin D3',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'With breakfast',
          remaining: 18
        }
      ]
    },
    {
      id: 5,
      doctor: 'Dr. Kavita Singh',
      date: '2024-08-20',
      status: 'Completed',
      medications: [
        {
          name: 'Vitamin D3 1000 IU',
          dosage: '1 capsule',
          frequency: 'Once weekly',
          duration: '12 weeks',
          instructions: 'With milk or after meal',
          remaining: 0
        }
      ]
    }
  ];

app.get('/api/prescriptions/:abhaId', (req, res) => {
    // In a real application, you would fetch prescriptions based on the abhaId
    // For now, we'll just return the mock data
    res.json(prescriptions);
});

// Handle the menu selection
app.post('/ivr/handle-menu-selection', (req, res) => {
  const selection = req.body.Digits;
  const abhaId = req.query.abhaId;
  const twiml = new twilio.twiml.VoiceResponse();

  // TODO: Fetch patient data based on abhaId

  if (selection === '1') {
    const latestPrescription = prescriptions[0];
    const medications = latestPrescription.medications.map(med => `${med.name}, ${med.dosage}, ${med.frequency} for ${med.duration}`).join('. ');
    twiml.say(`Your latest prescription from ${latestPrescription.doctor} on ${latestPrescription.date} is: ${medications}.`);
  } else if (selection === '2') {
    // TODO: Fetch and read the emergency medical information
    twiml.say('Your emergency medical information is: Patient has a severe allergy to peanuts. In case of accidental exposure, administer EpiPen immediately and call emergency services.');
  } else {
    twiml.say('Invalid selection.');
  }

  twiml.say('Thank you for using Aarogyam. Goodbye.');
  twiml.hangup();

  res.type('text/xml');
  res.send(twiml.toString());
});


// Handle SPA routing - decode URI components before sending to client
app.get('*', (req, res, next) => {
  // Decode URI components to handle encoded characters
  const decodedPath = decodeURIComponent(req.path);
  
  // If the path contains encoded spaces, redirect to the decoded version
  if (req.path.includes('%20') && req.path === encodeURI(decodedPath)) {
    return res.redirect(302, decodedPath);
  }
  
  next();
});

// Serve index.html for all routes to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Access from other devices: http://YOUR_LOCAL_IP:${PORT}`);
  console.log('Make sure to replace YOUR_LOCAL_IP with your computer\'s local IP address');
});
