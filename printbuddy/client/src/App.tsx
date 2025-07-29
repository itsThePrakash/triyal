import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [orderType, setOrderType] = useState<'bw' | 'color'>('bw');
  const [isFemale, setIsFemale] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [feedback, setFeedback] = useState('');

  const serverUrl = 'https://printsbuddy-server1.vercel.app/api';

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please upload a file.');
    if (!customerPhone.match(/^\+91[0-9]{10}$/)) return alert('Please enter a valid phone number (+91XXXXXXXXXX).');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderType', orderType);
    formData.append('isFemale', isFemale.toString());
    formData.append('customerPhone', customerPhone);

    try {
      await axios.post(`${serverUrl}/orders`, formData);
      alert('Order placed successfully! We will contact you for confirmation.');
      setFile(null);
      setOrderType('bw');
      setIsFemale(false);
      setCustomerPhone('');
    } catch (error) {
      alert('Error placing order. Please try again.');
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return alert('Please enter feedback.');
    try {
      await axios.post(`${serverUrl}/feedback`, { feedback });
      alert('Feedback submitted!');
      setFeedback('');
    } catch (error) {
      alert('Error submitting feedback.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Navigation */}
      <nav className="bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">Print$buddy</h1>
          <ul className="flex space-x-6">
            <li><a href="#home" className="hover:text-blue-400 transition duration-300">Home</a></li>
            <li><a href="#order" className="hover:text-blue-400 transition duration-300">Order</a></li>
            <li><a href="#feedback" className="hover:text-blue-400 transition duration-300">Feedback</a></li>
            <li><a href="#about" className="hover:text-blue-400 transition duration-300">About</a></li>
          </ul>
        </div>
      </nav>

      {/* Home Section */}
      <section id="home" className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-extrabold mb-6 animate-fade-in">Welcome to Print$buddy</h2>
        <p className="text-xl mb-4">Late-night printing services at MNIT Jaipur, available until 2 AM!</p>
        <p className="text-lg mb-8">Black & White: ₹4 | Color: ₹14 | Girls’ Delivery: ₹25</p>
        <a
          href="https://wa.me/919251028070?text=Hi,%20I%27d%20like%20to%20place%20an%20order%20for%20printing."
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-300 transform hover:scale-105"
        >
          Order via WhatsApp
        </a>
      </section>

      {/* Order Section */}
      <section id="order" className="container mx-auto px-4 py-16 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold mb-8 text-center">Place Your Order</h2>
        <form onSubmit={handleOrderSubmit} className="max-w-lg mx-auto space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Upload File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Print Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as 'bw' | 'color')}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="bw">Black & White (₹4)</option>
              <option value="color">Color (₹14)</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Phone Number (+91XXXXXXXXXX)</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              placeholder="+919251028070"
              required
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isFemale}
                onChange={(e) => setIsFemale(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
              />
              <span className="text-sm">Delivery for girls (₹25 extra)</span>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition duration-300 transform hover:scale-105"
          >
            Place Order
          </button>
        </form>
      </section>

      {/* Feedback Section */}
      <section id="feedback" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Share Your Feedback</h2>
        <form onSubmit={handleFeedbackSubmit} className="max-w-lg mx-auto space-y-6">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 h-32 resize-y"
            placeholder="Your feedback..."
            required
          ></textarea>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition duration-300 transform hover:scale-105"
          >
            Submit Feedback
          </button>
        </form>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-16 text-center bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold mb-6">About Print$buddy</h2>
        <p className="text-lg mb-4">
          Print$buddy provides affordable, late-night printing services for MNIT students, with convenient delivery to girls' hostel gates.
        </p>
        <p className="text-lg">
          Our vision is to become a leading printing service, ensuring quality and reliability until 2 AM.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 p-6 text-center">
        <p>Contact us: +91 9251028070 | Print$buddy © 2025</p>
      </footer>
    </div>
  );
};

export default App;
