require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const connectDB = require('./config/db/index');
const admin = require('firebase-admin');
const path = require('path');

// ========== Khởi tạo Firebase Admin ==========
const serviceAccount = require('./config/firebase/food-482bb-firebase-adminsdk-fbsvc-c869e919a3.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin initialized');

connectDB();

const app = express();
const PORT = process.env.PORT;

app.use(morgan('combined'));
app.use(express.json());

// ========== Routes ==========
const authRoutes         = require('./app/routes/authRoutes');
const userRoutes         = require('./app/routes/userRoutes');
const profileRoutes      = require('./app/routes/profileRoutes');
const foodDonationRoutes = require('./app/routes/foodDonationRoutes');
const foodRequestRoutes  = require('./app/routes/foodRequestRoutes');

app.use('/api/auth',            authRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/profile',         profileRoutes);
app.use('/api/food-donations',  foodDonationRoutes);
app.use('/api/food-requests',   foodRequestRoutes);

app.get('/', (_, res) => res.send('Hello world'));

app.listen(PORT, "0.0.0.0", () =>
    console.log(`Server listening on http://192.168.0.227:${PORT}`)
);