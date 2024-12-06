// Fetch transactions from the backend and populate the table
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/transactions'); // Replace with your API endpoint
        const transactions = await response.json();

        const tableBody = document.getElementById('transactions-table-body');

        if (transactions.length > 0) {
            tableBody.innerHTML = ''; // Clear existing rows before populating
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.date}</td>
                    <td>${transaction.transactionId}</td>
                    <td>$${transaction.amount.toFixed(2)}</td>
                    <td class="status">${transaction.status}</td>
                `;
                tableBody.appendChild(row);

                // Apply status color dynamically
                const statusCell = row.querySelector('.status');
                if (transaction.status === 'Pending') {
                    statusCell.style.color = '#FFC107'; // Yellow for Pending
                } else if (transaction.status === 'Paid') {
                    statusCell.style.color = '#28A745'; // Green for Paid
                } else if (transaction.status === 'Failed') {
                    statusCell.style.color = '#DC3545'; // Red for Failed
                }
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="4">No transactions found.</td></tr>`;
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        const tableBody = document.getElementById('transactions-table-body');
        tableBody.innerHTML = `<tr><td colspan="4">Unable to load transactions. Please try again later.</td></tr>`;
    }
});

// Highlight the active page in the navbar
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-item a');
    const currentPage = window.location.pathname; // Get the current page path

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active'); // Add the active class to the current link
        } else {
            link.classList.remove('active'); // Ensure no other link has the class
        }
    });
});

// Add status color dynamically after fetching data
function applyStatusColors() {
    const rows = document.querySelectorAll('.transaction-table tbody tr');
    rows.forEach(row => {
        const statusCell = row.querySelector('.status'); // Get the status column
        if (statusCell) {
            const statusText = statusCell.textContent.trim();
            // Add a color based on the status
            if (statusText === 'Pending') {
                statusCell.style.color = '#FFC107'; // Yellow
            } else if (statusText === 'Paid') {
                statusCell.style.color = '#28A745'; // Green
            } else if (statusText === 'Failed') {
                statusCell.style.color = '#DC3545'; // Red
            }
        }
    });
}


