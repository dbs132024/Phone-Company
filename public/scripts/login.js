document.getElementById('loginForm').addEventListener('submit', async function(event){
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try{
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username,password })        });

        const data = await response.json();
        if (response.ok){
           localStorage.setItem('token', data.token);
           
           //redirect to mainpage
           window.location.href = 'dashboard.html';
        } else{
            //error message
          document.getElementById('loginMessage').innerText = data.message || 'Login failed. Please try again.';
        }
    }catch (error) {
    console.error('Error during login:', error);
    document.getElementById('loginMessage').innerText = 'An error occurred. Please try again later.';
  }
});