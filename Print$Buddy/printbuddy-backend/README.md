Print$Buddy Backend
  Backend for Print$Buddy, handling feedback and order submissions with MongoDB, AWS S3, and Twilio WhatsApp notifications.

  ## Setup
  1. Clone the repository: `git clone https://github.com/print-buddy/printbuddy-backend.git`
  2. Install dependencies: `npm install`
  3. Set environment variables:
     - `MONGODB_URI`: MongoDB Atlas connection string
     - `AWS_ACCESS_KEY_ID`: AWS IAM user access key
     - `AWS_SECRET_ACCESS_KEY`: AWS IAM user secret key
     - `TWILIO_ACCOUNT_SID`: Twilio Account SID
     - `TWILIO_AUTH_TOKEN`: Twilio Auth Token
  4. Deploy to Vercel: `vercel`

  ## Endpoints
  - `POST /api/feedback`: Submit feedback
  - `POST /api/orders`: Submit orders with file uploads
  - `GET /`: Health check

