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

app.get('/customer', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customer');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

  // CRUD operations for plans

  app.get('/phoneplan', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM phoneplan');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

// CRUD operations for bankaccounts

app.get('/bankaccount', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bankaccount');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(500);
    }
});

//Transaction endpoint
app.post('/make-payment', async (req, res) => {
    const { customerId, billingId, amount, cardNumber } = req.body;

    try {
        await pool.query('BEGIN');
        // Insert into Payment table
        await pool.query(
            `INSERT INTO Payment (customer_id, billing_id, bank_account_id, payment_date, amount, payment_type)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'pre-paid')`,
            [customerId, billingId, customerId, amount]
        );

        // Update BankAccount balance
        await pool.query(
            `UPDATE BankAccount SET balance = balance - $1 WHERE customer_id = $2`,
            [amount, customerId]
        );

        await pool.query('COMMIT');
        res.status(200).json({ message: 'Payment successful' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    }
});
// Account Information Retrieval Endpoint
app.get('/account-info/:customerId', async (req, res) => {
    const { customerId } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                c.name AS customer_name,
                c.email,
                c.phone_number,
                p.plan_type,
                p.data_limit,
                p.call_limit,
                p.cost_per_minute,
                p.cost_per_mb,
                b.balance
            FROM 
                Customer c
            JOIN 
                PhonePlan p ON c.customer_id = p.customer_id
            JOIN 
                BankAccount b ON c.customer_id = b.customer_id
            WHERE 
                c.customer_id = $1;
        `, [customerId]);

        if (result.rows.length === 0) {
            console.log('No customer found with the provided ID.');
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error retrieving account information:', error);
        res.status(500).json({ message: 'Error retrieving account information' });
    }
});

// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));