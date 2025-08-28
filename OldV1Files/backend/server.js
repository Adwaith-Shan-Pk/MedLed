// server/index.js (Node.js/Express)

const express = require('express');
const cors = require('cors');
const Tesseract = require('tesseract.js');
const crypto = require('crypto');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// A simple in-memory database for demonstration
const prescriptionsDB = {};

app.post('/verify-prescription', async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).send({ error: 'Image URL is required' });
  }

  try {
    const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng');

    // Simple hashing based on extracted text
    const prescriptionHash = crypto.createHash('sha256').update(text).digest('hex');

    // Check for duplicate hash
    if (prescriptionsDB[prescriptionHash]) {
      return res.status(409).send({ status: 'fake', message: 'This prescription has been uploaded before.' });
    }

    // This is where you would call the Clarity contract to add the hash
    // We'll simulate it for this MVP
    prescriptionsDB[prescriptionHash] = {
      hash: prescriptionHash,
      text: text,
      timestamp: Date.now()
    };

    res.send({ status: 'genuine', message: 'Prescription is genuine and recorded.', prescriptionHash });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error processing image' });
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});