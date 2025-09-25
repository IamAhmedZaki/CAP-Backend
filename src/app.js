require('dotenv').config();
const express = require('express');

const sendEmailRoutes = require('./routes/sendEmail.routes');


const cors = require('cors');


const path = require('path');

const app = express();



// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'))); // serve files

// Routes
// app.use('/api/users', authenticate, usersRoutes);
// app.use('/api/users', authenticate, usersRoutes);

app.use('/api/sendEmail', sendEmailRoutes);






// Redirect root to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});