document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('registerMessage').innerText = 'Registration successful!';
            window.location.href = 'login.html'; // Redirect to login page
        } else {
            document.getElementById('registerMessage').innerText = data.message || 'Registration failed. Please try again.';
        }
    } catch (error) {
        console.error('Error during registration:', error);
        document.getElementById('registerMessage').innerText = 'An error occurred. Please try again later.';
    }
});
