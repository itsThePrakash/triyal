const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.post('/api/orders', upload.single('file'), (req, res) => {
    const { name, email, service, details } = req.body;
    const file = req.file;

    if (!name || !email || !service || !details || !file) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // For real apps: upload file to S3, notify via email or WhatsApp
    console.log('Order Received:', { name, email, service, details, file });
    res.status(200).json({ message: 'Order submitted successfully' });
});

app.post('/api/feedback', (req, res) => {
    const { name, email, feedback, rating } = req.body;

    if (!feedback || !rating) {
        return res.status(400).json({ message: 'Missing feedback or rating' });
    }

    // Save feedback to DB or notify admin
    console.log('Feedback Received:', { name, email, feedback, rating });
    res.status(200).json({ message: 'Feedback submitted successfully' });
});

module.exports = app;
