// Sidebar toggle functionality
function openNav() {
    document.querySelector('.sidebar').classList.add('expanded');
    document.querySelector('#main').classList.add('expanded');
}

function closeNav() {
    document.querySelector('.sidebar').classList.remove('expanded');
    document.querySelector('#main').classList.remove('expanded');
}

// Fetch and display customers
async function fetchData() {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:3000/protected-data', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        const data = await response.json();
        console.log(data);
    } else {
        console.log('Failed to fetch data.');
    }
}

// Fetch customers
async function fetchCustomers() {
    try {
        const response = await fetch('http://localhost:3000/customer');
        const customers = await response.json();
        const table = document.getElementById('customerTable');
        table.innerHTML = '';
        customers.forEach(customer => {
            const row = `
                <tr>
                    <td>${customer.customer_id}</td>
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone_number}</td>
                    <td>${customer.address}</td>
                    <td>${customer.plan_type}</td>
                    <td>${customer.created_at}</td>
                </tr>
            `;
            table.innerHTML += row;
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
    }
}

// Add a new customer
async function addCustomer(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const email = document.getElementById('email').value;
    const phone_number = document.getElementById('Phone').value;
    const plan_type = document.querySelector('input[name="plantype"]:checked').value;

    try {
        await fetch('http://localhost:3000/customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, address, email, phone_number, plan_type })
        });
        document.getElementById('customerInfo').reset();
        fetchCustomers();
    } catch (error) {
        console.error('Error adding customer:', error);
    }
}

// Update a customer
async function updateCustomer() {
    const id = document.getElementById('customerIdUpdate').value;
    const name = document.getElementById('newCustomerName').value;

    try {
        await fetch(`http://localhost:3000/customer/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        fetchCustomers();
    } catch (error) {
        console.error('Error updating customer:', error);
    }
}

// Delete a customer
async function deleteCustomer() {
    const id = document.getElementById('customerIdDelete').value;

    try {
        await fetch(`http://localhost:3000/customer/${id}`, { method: 'DELETE' });
        fetchCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
    }
}

// Fetch and display phone plans
async function fetchPlans() {
    try {
        const response = await fetch('http://localhost:3000/phoneplan');
        const phoneplans = await response.json();
        const table = document.getElementById('planTable');
        table.innerHTML = '';
        phoneplans.forEach(plan => {
            const row = `
                <tr>
                    <td>${plan.plan_id}</td>
                    <td>${plan.plan_name}</td>
                    <td>${plan.plan_type}</td>
                    <td>${plan.data_limit}</td>
                    <td>${plan.call_limit}</td>
                    <td>${plan.price}</td>
                    <td>${plan.cost_per_minute}</td>
                    <td>${plan.cost_per_mb}</td>
                </tr>
            `;
            table.innerHTML += row;
        });
    } catch (error) {
        console.error('Error fetching phone plans:', error);
    }
}

// Add a new phone plan
async function addPlan() {
    const plan_name = document.getElementById('planName').value;

    try {
        await fetch('http://localhost:3000/phoneplan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_name })
        });
        document.getElementById('planName').value = ''; // Clear input
        fetchPlans();
    } catch (error) {
        console.error('Error adding phone plan:', error);
    }
}

// Update a phone plan
async function updatePlan() {
    const id = document.getElementById('planIdUpdate').value;
    const plan_name = document.getElementById('newPlanName').value;

    try {
        await fetch(`http://localhost:3000/phoneplan/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_name })
        });
        fetchPlans();
    } catch (error) {
        console.error('Error updating phone plan:', error);
    }
}

// Delete a phone plan
async function deletePlan() {
    const id = document.getElementById('planIdDelete').value;

    try {
        await fetch(`http://localhost:3000/phoneplan/${id}`, { method: 'DELETE' });
        fetchPlans();
    } catch (error) {
        console.error('Error deleting phone plan:', error);
    }
}

// Fetch and display bank accounts
async function fetchBankAccounts() {
    try {
        const response = await fetch('http://localhost:3000/bankaccount');
        const bankaccounts = await response.json();
        const table = document.getElementById('bankaccountTable');
        table.innerHTML = '';
        bankaccounts.forEach(account => {
            const row = `
                <tr>
                    <td>${account.bank_account_id}</td>
                    <td>${account.customer_id}</td>
                    <td>${account.balance}</td>
                    <td>${account.bank_name}</td>
                    <td>${account.card_number}</td>
                    <td>${account.card_expiry}</td>
                </tr>
            `;
            table.innerHTML += row;
        });
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
    }
}

// Fetch and display account information
async function getAccountInfo() {
    const customerId = document.getElementById('customerIdInfo').value;

    if (!customerId) {
        alert('Please enter a Customer ID.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/account-info/${customerId}`);
        if (!response.ok) {
            throw new Error('Customer not found');
        }

        const accountInfo = await response.json();
        displayAccountInfo(accountInfo);
    } catch (error) {
        console.error('Error fetching account information:', error);
        alert('Error fetching account information.');
    }
}

// Display account information on the page
function displayAccountInfo(info) {
    const accountInfoDiv = document.getElementById('account-info');
    accountInfoDiv.innerHTML = `
        <h3>Account Information</h3>
        <p><strong>Name:</strong> ${info.customer_name}</p>
        <p><strong>Email:</strong> ${info.email}</p>
        <p><strong>Phone Number:</strong> ${info.phone_number}</p>
        <p><strong>Plan Type:</strong> ${info.plan_type}</p>
        <p><strong>Data Limit:</strong> ${info.data_limit} MB</p>
        <p><strong>Call Limit:</strong> ${info.call_limit} minutes</p>
        <p><strong>Cost per Minute:</strong> $${info.cost_per_minute}</p>
        <p><strong>Cost per MB:</strong> $${info.cost_per_mb}</p>
        <p><strong>Bank Balance:</strong> $${info.balance}</p>
    `;
}

// Load data when the page loads
window.onload = function() {
    fetchCustomers();
    fetchPlans();
    fetchBankAccounts();
};

// Attach event listeners
document.getElementById('customerInfo').addEventListener('submit', addCustomer);
document.getElementById('paymentForm').addEventListener('submit', function(event) {
    event.preventDefault();
    makePayment();
});
