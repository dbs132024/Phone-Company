const express = require('express'); //express works as backend service, for parsing request from the HTML webapp
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET ||'dbs13';

//middleware to authenticate and authorize 
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(403);

    try {
        const user = await jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        return res.sendStatus(403);
    }
}
function generateToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: '1h' // Token expires in 1 hour
    });
}

// Route to register a new user
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        // Check if username already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        // Insert new user 
        const result = await pool.query(
            `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING user_id`,
            [username, hashedPassword, role || 'customer'] // Default role if not specified
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});


// Route to log in an existing user
app.post('/login', async (req, res) => {
     console.log('Request Body:', req.body); // Log the incoming data for debugging
    const { username, password } = req.body;

    try {
        // Check if user exists
        const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Example of a protected route
app.get('/customer-data', authenticateToken, async (req, res) => {
    if (req.user.role !== 'customer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const result = await pool.query('SELECT * FROM customer');
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.sendStatus(500);
    }
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

// Payment Processing Route
app.post('/make-payment', async (req, res) => {
    const { paymentId, customerId, cardNumber, cardExpiry } = req.body;

    try {
        // Verify if the payment exists and retrieve amount due
        const paymentResult = await pool.query(
            'SELECT amount, status FROM Payment WHERE payment_id = $1 AND customer_id = $2',
            [paymentId, customerId]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Payment not found or customer ID mismatch.' });
        }

        const payment = paymentResult.rows[0];

        // Check if the payment has already been completed
        if (payment.status === 'paid') {
            return res.status(400).json({ message: 'This payment has already been completed.' });
        }

        // Verify card information against the BankAccount table
        const accountResult = await pool.query(
            'SELECT balance FROM BankAccount WHERE customer_id = $1 AND card_number = $2 AND card_exp = $3',
            [customerId, cardNumber, cardExpiry]
        );

        if (accountResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid card information.' });
        }

        const account = accountResult.rows[0];

        // Check if the customer has sufficient funds
        if (account.balance < payment.payment_amount) {
            return res.status(400).json({ message: 'Insufficient balance in bank account.' });
        }

        // Begin transaction to deduct amount and mark payment as completed
        await pool.query('BEGIN');

        // Deduct amount from bank account balance
        await pool.query(
            'UPDATE BankAccount SET balance = balance - $1 WHERE customer_id = $2 AND card_number = $3',
            [payment.payment_amount, customerId, cardNumber]
        );

        // Update payment status to "paid"
        await pool.query(
            'UPDATE Payment SET status = $1, payment_date = CURRENT_TIMESTAMP WHERE payment_id = $2',
            ['paid', paymentId]
        );

        // Commit the transaction
        await pool.query('COMMIT');

        res.status(200).json({ message: 'Payment successful!' });
    } catch (error) {
        // Rollback in case of an error
        await pool.query('ROLLBACK');
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Payment processing failed. Please try again later.' });
    }
});


// Account Information Retrieval Endpoint
// Route to get account information based on customer ID
app.get('/account-info/:customerId', async (req, res) => {
    const { customerId } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                c.customer_name,
                c.email,
                c.phone_number,
                pp.plan_type,
                p.amount,
                p.status,
                p.due_date,
                ba.card_number,
                ba.card_exp
            FROM 
                Customer c
            JOIN 
                PhonePlan pp ON c.customer_id = pp.customer_id
            LEFT JOIN 
                Payment p ON c.customer_id = p.customer_id
            LEFT JOIN 
                BankAccount ba ON c.customer_id = ba.customer_id
            WHERE 
                c.customer_id = $1;
        `, [customerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error retrieving account information:', error);
        res.status(500).json({ message: 'Error retrieving account information' });
    }
});

app.get('/current-bill/:customerId', async (req, res) => {
    const { customerId } = req.params;

    try {
        const result = await pool.query(`
            SELECT payment_amount AS amount_due, due_date, status
            FROM Payment
            WHERE customer_id = $1 AND status = 'Unpaid'
            ORDER BY due_date DESC LIMIT 1
        `, [customerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No current unpaid bill found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching current bill:', error);
        res.status(500).json({ message: 'Error fetching current bill.' });
    }
});
// Simulation Route
app.post('/simulate', async (req, res) => {
    try {
        // Insert data into Customer table
        await pool.query(`
            INSERT INTO Customer (name, plan_type, email, phone_number, address)
            VALUES
            ('Alice Johnson', 'pre-paid', 'alice.johnson@example.com', '1234567890', '123 Elm St'),
            ('Bob Smith', 'post-paid', 'bob.smith@example.com', '0987654321', '456 Oak St'),
            ('Charlie Brown', 'pre-paid', 'charlie.brown@example.com', '1112223333', '789 Maple St'),
            ('Daisy Miller', 'post-paid', 'daisy.miller@example.com', '4445556666', '101 Pine St'),
            ('Ethan Hunt', 'pre-paid', 'ethan.hunt@example.com', '7778889999', '202 Cedar St');
        `);

        // Insert data into BankAccount table
        await pool.query(`
            INSERT INTO BankAccount (customer_id, balance, card_number, card_exp)
            VALUES
            (1, 100.00, '1234123412341234', '12/25'),
            (2, 200.00, '5678567856785678', '11/24'),
            (3, 50.00, '9876987698769876', '10/23'),
            (4, 150.00, '5432543254325432', '09/26'),
            (5, 75.00, '6789678967896789', '08/25');
        `);

        // Insert data into PhonePlan table
        await pool.query(`
            INSERT INTO PhonePlan (customer_id, plan_type, data_limit, call_limit, cost_per_minute, cost_per_mb)
            VALUES
            (1, 'pre-paid', 500, 300, 0.05, 0.10),
            (2, 'post-paid', 2000, 1000, 0.03, 0.08),
            (3, 'pre-paid', 1000, 500, 0.04, 0.09),
            (4, 'post-paid', 5000, 2000, 0.02, 0.07),
            (5, 'pre-paid', 1500, 700, 0.05, 0.10);
        `);

        // Insert data into CallRecord table
        await pool.query(`
            INSERT INTO CallRecord (customer_id, call_destination, duration, cost, data_usage)
            VALUES
            (1, 1001, 300, 15.00, 50),
            (2, 1002, 600, 18.00, 100),
            (3, 1003, 150, 6.00, 20),
            (4, 1004, 240, 12.00, 35),
            (5, 1005, 180, 9.00, 25);
        `);

        // Insert data into Payment table
        await pool.query(`
            INSERT INTO Payment (customer_id, billing_id, bank_account_id, amount, payment_type, status, due_date)
            VALUES
            (1, 1, 1, 25.00, 'pre-paid', 'unpaid', CURRENT_DATE + INTERVAL '30 days'),
            (2, 2, 2, 50.00, 'post-paid', 'paid', CURRENT_DATE + INTERVAL '30 days'),
            (3, 3, 3, 15.00, 'pre-paid', 'unpaid', CURRENT_DATE + INTERVAL '30 days'),
            (4, 4, 4, 60.00, 'post-paid', 'paid', CURRENT_DATE + INTERVAL '30 days'),
            (5, 5, 5, 20.00, 'pre-paid', 'unpaid', CURRENT_DATE + INTERVAL '30 days');
        `);

        // Insert data into UsageSummary table
        await pool.query(`
            INSERT INTO UsageSummary (payment_id, total_minutes, total_data, total_cost)
            VALUES
            (1, 300, 500, 20.00),
            (2, 600, 1000, 40.00),
            (3, 150, 300, 15.00),
            (4, 240, 800, 30.00),
            (5, 180, 600, 25.00);
        `);

        // Insert data into Device table
        await pool.query(`
            INSERT INTO Device (customer_id, model_name, network_features)
            VALUES
            (1, 'iPhone 13', '5G'),
            (2, 'Samsung Galaxy S21', '5G'),
            (3, 'Google Pixel 6', '5G'),
            (4, 'OnePlus 9', '5G'),
            (5, 'iPhone 12', '4G');
        `);

        res.json({ message: 'Simulation data populated successfully.' });
    } catch (error) {
        console.error('Error running simulation:', error);
        res.status(500).json({ message: 'Failed to populate simulation data.' });
    }
});

const { exec } = require('child_process');

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');

    // Automatically open the browser based on the OS
    const url = 'http://localhost:3000';
    const startCommand = process.platform === 'darwin' ? 'open' :
                         process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${startCommand} ${url}`);
});

