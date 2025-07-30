```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const app = express();

// Middleware
app.use(cors({ origin: 'https://print-buddy.github.io' })); // Allow GitHub Pages
app.use(express.json());

// Rate limiting to prevent spam
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100 // 100 requests per IP
});
app.use('/api', limiter);

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|docx|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOCX, JPG, and PNG files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    feedback: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    service: { type: String, required: true, enum: ['document', 'poster'] },
    filePath: { type: String, required: true },
    details: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Feedback Endpoint
app.post(
    '/api/feedback',
    [
        body('feedback').notEmpty().withMessage('Feedback is required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { name, email, feedback, rating } = req.body;

        try {
            const newFeedback = new Feedback({ name, email, feedback, rating });
            await newFeedback.save();
            res.status(201).json({ message: 'Feedback submitted successfully' });
        } catch (error) {
            console.error('Error saving feedback:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Order Endpoint
app.post(
    '/api/orders',
    upload.single('file'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('service').isIn(['document', 'poster']).withMessage('Invalid service type'),
        body('details').notEmpty().withMessage('Order details are required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }

        const { name, email, service, details } = req.body;

        try {
            const newOrder = new Order({
                name,
                email,
                service,
                filePath: req.file.path,
                details
            });
            await newOrder.save();
            res.status(201).json({ message: 'Order submitted successfully' });
        } catch (error) {
            console.error('Error saving order:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```
