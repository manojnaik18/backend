const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const resultRoutes = require('./routes/results');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./routes/authMiddleware');

const app = express();

// CORS Configuration
const allowedOrigins = ['https://teachdashboard.netlify.app', 'http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

const seedUsers = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            const salt = await bcrypt.genSalt(10);
            const users = [
                {
                    email: 'anjali.kapoor@example.com',
                    password: await bcrypt.hash('password123', salt),
                    name: 'Mrs. Anjali Kapoor'
                },
                {
                    email: 'other.teacher@example.com',
                    password: await bcrypt.hash('password456', salt),
                    name: 'Mr. Sharma'
                }
            ];
            await User.insertMany(users);
            console.log('Initial users seeded.');
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
};

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        seedUsers();
    })
    .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/results', authMiddleware, resultRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
