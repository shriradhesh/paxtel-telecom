const express = require('express');
const app = express();
require('dotenv').config();
const Port = process.env.PORT || 3009;
const bodyParser = require('body-parser');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes'); // Ensure this exports a router
const db = require('./config/db'); // Database configuration

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('uploads'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

// Router configuration
app.use('/api', adminRoutes);

app.post('/', (req, res) => {
    res.send('Hello from Paxtel Server');
});

app.listen(Port, () => {
    console.log(`Server is Running on PORT: ${Port}`);
});
