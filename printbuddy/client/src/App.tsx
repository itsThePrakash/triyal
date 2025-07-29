import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [orderType, setOrderType] = useState<'bw' | 'color'>('bw');
  const [isFemale, setIsFemale] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [feedback, setFeedback] = useState('');

  const serverUrl = 'https://printsbuddy-server.vercel.app/api';

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
    try {
      await axios.post(`${serverUrl}/feedback`, { feedback });
      alert('Feedback submitted!');
      setFeedback('');
    } catch (error) {
      alert('Error submitting feedback.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="text-2xl font-bold">Print$buddy</h1>
          <ul className="flex space-x-4">
            <li><a href="#home" className="hover:underline">Home</a></li>
            <li><a href="#order" className="hover:underline">Order</a></li>
            <li><a href="#feedback" className="hover:underline">Feedback</a></li>
            <li><a href="#about" className="hover:underline">About</a></li>
          </ul>
        </div>
      </nav>

      <section id="home" className="container mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Welcome to Print$buddy</h2>
        <p className="text-lg mb-4">Late-night printing at MNIT Jaipur hostel (until 2 AM)!</p>
        <p className="text-lg mb-4">B&W: ₹4 | Color: ₹14 | Delivery for girls: ₹25</p>
        <a
          href="https://wa.me/919251028070?text=Hi,%20I%27d%20like%20to%20place%20an%20order%20for%20printing."
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Order via WhatsApp
        </a>
      </section>

      <section id="order" className="container mx-auto p-8">
        <h2 className="text-2xl font-bold mb-4">Place Your Order</h2>
        <form onSubmit={handleOrderSubmit} className="max-w-md mx-auto">
          <div className="mb-4">
            <label className="block mb-2">Upload File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Print Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as 'bw' | 'color')}
              className="w-full p-2 border rounded"
            >
              <option value="bw">Black & White (₹4)</option>
              <option value="color">Color (₹14)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Phone Number (+91XXXXXXXXXX)</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="+919251028070"
              required
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isFemale}
                onChange={(e) => setIsFemale(e.target.checked)}
                className="mr-2"
              />
              Delivery for girls (₹25 extra)
            </label>
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Place Order
          </button>
        </form>
      </section>

      <section id="feedback" className="container mx-auto p-8">
        <h2 className="text-2xl font-bold mb-4">Feedback</h2>
        <form onSubmit={handleFeedbackSubmit} className="max-w-md mx-auto">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Your feedback..."
            required
          ></textarea>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Submit Feedback
          </button>
        </form>
      </section>

      <section id="about" className="container mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">About Print$buddy</h2>
        <p className="text-lg mb-4">
          Founded by Prakash (MNIT CSE 4th Year), Manish Meena (MNIT CSE 4th Year), and co-founder Tanik Saini (MNIT Meta 4th Year).
        </p>
        <p className="text-lg">
          We provide affordable, late-night printing services for MNIT students, with delivery to girls' hostel gates. Our vision is to grow Print$buddy into a leading printing company.
        </p>
      </section>

      <footer className="bg-blue-600 text-white p-4 text-center">
        <p>Contact us: +91 9251028070 | Print$buddy © 2025</p>
      </footer>
    </div>
  );
};

export default App;
