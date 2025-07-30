const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const AWS = require('aws-sdk');
const twilio = require('twilio');
const multer = require('multer');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiter
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 100 });
app.use('/api', limiter);

// AWS S3 setup
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-south-1'
});

// Twilio setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// MongoDB Schemas
const Feedback = mongoose.model('Feedback', new mongoose.Schema({
  name: String,
  email: String,
  feedback: String,
  rating: Number,
  createdAt: { type: Date, default: Date.now }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  name: String,
  email: String,
  service: String,
  fileUrl: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
}));

// File Upload setup
const upload = multer({ storage: multer.memoryStorage() });

function uploadToS3(file, callback) {
  const params = {
    Bucket: 'printbuddy-files',
    Key: Date.now() + '-' + file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  s3.upload(params, (err, data) => {
    if (err) return callback(err);
    callback(null, data.Location);
  });
}

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'PrintBuddy backend running' });
});

// Feedback route
app.post('/api/feedback', [
  body('feedback').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });

  try {
    await new Feedback(req.body).save();
    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Order route
app.post('/api/orders', upload.single('file'), [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('service').notEmpty(),
  body('details').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });

  if (!req.file)
    return res.status(400).json({ message: 'File is required' });

  uploadToS3(req.file, async (err, fileUrl) => {
    if (err) return res.status(500).json({ message: 'S3 upload failed' });

    try {
      await new Order({ ...req.body, fileUrl }).save();

      // Send WhatsApp message via Twilio sandbox
      await twilioClient.messages.create({
        body: `New order from ${req.body.name} (${req.body.email}) for service: ${req.body.service}`,
        from: 'whatsapp:+14155238886',  // Twilio sandbox
        to: 'whatsapp:+919251028070'    // Your number
      });

      res.json({ message: 'Order placed successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to save order or send message' });
    }
  });
});

module.exports = app;
module.exports.handler = serverless(app);
