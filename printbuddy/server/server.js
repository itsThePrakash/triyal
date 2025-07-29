const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(multer().single('file'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schemas
const orderSchema = new mongoose.Schema({
  file: String,
  orderType: String,
  isFemale: Boolean,
  amount: Number,
  customerPhone: String,
  createdAt: { type: Date, default: Date.now },
});
const feedbackSchema = new mongoose.Schema({
  feedback: String,
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

// Order Endpoint
app.post('/api/orders', async (req, res) => {
  const { orderType, isFemale, customerPhone } = req.body;
  const amount = orderType === 'bw' ? 4 : 14;
  const totalAmount = isFemale ? amount + 25 : amount;

  try {
    await Order.create({
      file: req.file?.path,
      orderType,
      isFemale,
      amount: totalAmount,
      customerPhone,
    });
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Feedback Endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    await Feedback.create({ feedback: req.body.feedback });
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));