document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/call-records'); // Replace with your API endpoint
        const call_records = await response.json();

        const tableBody = document.getElementById('call_records-table-body');

        if (Array.isArray(call_records) && call_records.length > 0) {
            tableBody.innerHTML = ''; // Clear existing rows before populating
            call_records.forEach(call_record => {
                const row = document.createElement('tr');
                const amount = call_record.amount ? call_record.amount.toFixed(2) : '0.00'; // Ensure amount is valid
                row.innerHTML = `
                    <td>${call_record.date}</td>
                    <td>${call_record.call_id}</td>
                    <td>$${amount}</td>
                    <td class="status">${call_record.call_type}</td>
                `;
                tableBody.appendChild(row);

                // Apply status color dynamically
                const statusCell = row.querySelector('.status');
                if (call_record.call_type === 'Missed call') {
                    statusCell.style.color = '#DC3545'; // Red for missed calls
                }
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="4">No Call Record found.</td></tr>`;
        }
    } catch (error) {
        console.error('Error fetching call records:', error);
        const tableBody = document.getElementById('call_records-table-body');
        tableBody.innerHTML = `<tr><td colspan="4">Unable to load call records. Please try again later.</td></tr>`;
    }
});
