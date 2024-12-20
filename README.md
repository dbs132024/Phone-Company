DBS13 Cell Phone Company Management Application
This application simulates a cell phone company management system, allowing customers to view account information, make payments, and manage various data usage records. It includes backend logic for handling customer records, bank accounts, payments, and phone plans, with a front-end interface for user interaction.

This is a full-stack application built with Node.js, Express, and PostgreSQL. It provides a management dashboard for customers and includes features like account overview, payment handling, call records, and data usage tracking. It is designed for internal use by the company and external use by customers through the front-end dashboard.

Features
Customer registration and login with JWT authentication
Account dashboard displaying usage and billing information
Payment processing via card (no cash allowed)
Monthly billing simulation with calculated amounts based on phone plans
Database population with simulation data for testing purposes
Admin dashboard for customer and payment management
Prerequisites
Before you begin, ensure you have the following installed:

Node.js (version 14+)
PostgreSQL (version 12+)
Installation
The following command will install all necessary packages:
npm install express cors bcryptjs jsonwebtoken body-parser dotenv pg

Database Setup
Step 1: Create the Database
Open your PostgreSQL client (e.g., psql, pgAdmin).
Create a new database:
sql
Copy code
CREATE DATABASE cell_phone_management;
Step 2: Set Up Database User 
If you are using a different PostgreSQL username, create a new user or adjust the existing one. 

USER=postgres
HOST=localhost
DATABASE=hw4
PASSWORD=giabao123
PORT=5432
JWT_SECRET=dbs13

Step 3: Set Up Tables
Run the following scripts in sequence:
CREATE TABLE Customer (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('pre-paid', 'post-paid')),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    address VARCHAR(255),
	created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE BankAccount (
    bank_account_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    balance DECIMAL(10, 2) CHECK (balance >= 0),
    card_number VARCHAR(16) UNIQUE NOT NULL,
    card_exp VARCHAR(5) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);
CREATE TABLE PhonePlan (
    plan_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    plan_type VARCHAR(10) CHECK (plan_type IN ('pre-paid', 'post-paid')),
    data_limit DECIMAL(10, 2) CHECK (data_limit >= 0),  -- Data limit in MB
    call_limit INT CHECK (call_limit >= 0),              -- Call limit in minutes
    cost_per_minute DECIMAL(5, 2) CHECK (cost_per_minute >= 0),
    cost_per_mb DECIMAL(5, 2) CHECK (cost_per_mb >= 0),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);
CREATE TABLE CallRecord (
    call_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    call_destination SERIAL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration INT CHECK (duration >= 0),                 -- Duration in seconds
    cost DECIMAL(10, 2) CHECK (cost >= 0),              -- Cost of the call
    data_usage DECIMAL(10, 2) CHECK (data_usage >= 0),  -- Data in MB
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE Payment (
    payment_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    billing_id INT, 
    bank_account_id INT NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2) CHECK (amount > 0),
    payment_type VARCHAR(10) CHECK (payment_type IN ('pre-paid', 'post-paid')),
    status VARCHAR(10) CHECK (status IN ('paid', 'unpaid')),
    due_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (bank_account_id) REFERENCES BankAccount(bank_account_id)
);

CREATE TABLE UsageSummary (
    usage_id SERIAL PRIMARY KEY,
    payment_id INT NOT NULL,
    total_minutes INT CHECK (total_minutes >= 0),
    total_data DECIMAL(10, 2) CHECK (total_data >= 0),  -- in MB
    total_cost DECIMAL(10, 2) CHECK (total_cost >= 0),
    FOREIGN KEY (payment_id) REFERENCES Payment(payment_id)
);
CREATE TABLE Device (
device_id SERIAL PRIMARY KEY,
customer_id INT NOT NULL,
model_name VARCHAR(30),
network_features VARCHAR(5)
);
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('customer', 'employee')) NOT NULL
);

Run table creation script:

Running the Application
Start the PostgreSQL server if it�s not already running.

Run the server:

node server.js


Access the application by navigating to http://localhost:3000 in your web browser, or open index.html 

Testing
Login and Registration:

register (for customers) and log in to access the dashboard.
Upon successful login, a JWT token is saved to localStorage for session management.
Dashboard:
Use the Simulation button to auto-generate sample data for billing and call/data usage records
After logging in, users can view account details, recent payments, and data usage summaries by entering customer_id
Customers can access the Make a Payment section to pay their bills using a card.
Payment:

Customers can enter their payment information, including payment ID, customer ID, card number, and expiry date, to make payments.
