const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const AWS = require('aws-sdk');
const twilio = require('twilio');
const multer = require('multer');
const serverless = require('serverless-http'); // Required for Vercel

const app = express();

// Middleware
app.use(cors({ origin: 'https://print-buddy.vercel.app' }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100
});
app.use('/api', limiter);

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
});

// Twilio Configuration
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
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
    fileUrl: { type: String, required: true },
    details: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// File upload to S3
const uploadToS3 = (file, callback) => {
    const params = {
        Bucket: 'printbuddy-files',
        Key: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        Body: file.buffer,
        ContentType: file.mimetype
    };
    s3.upload(params, (err, data) => {
        if (err) {
            console.error('S3 upload error:', err);
            return callback(err, null);
        }
        callback(null, data.Location);
    });
};

// Multer for in-memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|docx|jpg|png/;
        const extname = filetypes.test(file.originalname.toLowerCase().split('.').pop());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only PDF, DOCX, JPG, and PNG files are allowed'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

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

        try {
            uploadToS3(req.file, async (err, fileUrl) => {
                if (err) {
                    return res.status(500).json({ message: 'File upload failed' });
                }

                const { name, email, service, details } = req.body;
                const newOrder = new Order({
                    name,
                    email,
                    service,
                    fileUrl,
                    details
                });
                await newOrder.save();

                try {
                    await twilioClient.messages.create({
                        body: `New Order from ${name} (${email})\nService: ${service}\nDetails: ${details}\nFile: ${fileUrl}`,
                        from: 'whatsapp:+14155238886',
                        to: 'whatsapp:+919251028070'
                    });
                    console.log('WhatsApp notification sent');
                } catch (twilioError) {
                    console.error('Twilio error:', twilioError);
                }

                res.status(201).json({ message: 'Order submitted successfully' });
            });
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

// Favicon Fallback
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// For local testing only
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
