const express = require('express'); //express works as backend service, for parsing request from the HTML webapp
const cors = require('cors');
const bodyParser = require('body-parser'); // is a middle-ware for extracting data from POST requests
const path = require('path'); // path provides utilities for managing directory paths
require('dotenv').config({
    override: true,
    path: path.join(__dirname, 'development.env')

})
const { Pool, Client } = require('pg'); // pg is a Postgres API for extablishing the connection

// Connect and Create an Express Application
const app = express();
const server = 3000;
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for cross-origin requests*/

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});

(async () => {
    const client = await pool.connect();
    try {
    const {rows} = await client.query('SELECT current_user');
    const currentUser = rows[0]['current_user']
    console.log(currentUser);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
})();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'public'));
});

// CRUD operations for customers

app.get('/customers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customers');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

  // CRUD operations for plans

  app.get('/plans', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM plans');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

// CRUD operations for bankaccounts

app.get('/bankaccounts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bankaccounts');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));