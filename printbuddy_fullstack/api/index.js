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
app.use(cors({ origin: '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 100 });
app.use('/api', limiter);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-south-1'
});

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const feedbackSchema = new mongoose.Schema({
  name: String, email: String, feedback: String, rating: Number, createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

const orderSchema = new mongoose.Schema({
  name: String, email: String, service: String, fileUrl: String, details: String, createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|docx|jpg|png/;
    const ext = allowed.test(file.originalname.toLowerCase().split('.').pop());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

const uploadToS3 = (file, callback) => {
  const params = {
    Bucket: 'printbuddy-files',
    Key: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  s3.upload(params, (err, data) => {
    if (err) return callback(err, null);
    callback(null, data.Location);
  });
};

app.post('/api/feedback', [
  body('feedback').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/orders', upload.single('file'), [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('service').isIn(['document', 'poster']),
  body('details').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  if (!req.file) return res.status(400).json({ message: 'File is required' });

  uploadToS3(req.file, async (err, fileUrl) => {
    if (err) return res.status(500).json({ message: 'File upload failed' });
    try {
      const order = new Order({ ...req.body, fileUrl });
      await order.save();
      await twilioClient.messages.create({
        body: `Order from ${req.body.name}: ${req.body.details}`,
        from: 'whatsapp:+14155238886',
        to: 'whatsapp:+919251028070'
      });
      res.status(201).json({ message: 'Order submitted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
});

app.get('/', (req, res) => res.json({ status: 'API is running' }));

module.exports = app;
module.exports.handler = serverless(app);
