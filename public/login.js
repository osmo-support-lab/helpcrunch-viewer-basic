
document.addEventListener('DOMContentLoaded', () => {
    getAppInfo();
});



document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/do-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Handle successful login, e.g., close popup, redirect
                window.location.href = '/';
            } else {
                document.getElementById('messages').innerText = data.message;
            }
        })
        .catch(error => console.error('Error:', error));
});


async function getAppInfo() {
    try {
        const response = await fetch('/app-info');
        if (response.ok) {
            const data = await response.json();
            const departmentName = data.departmentName;
            const elementsWithClassName = document.getElementsByClassName('department-name');
            Array.from(elementsWithClassName).forEach(element => {
                element.innerHTML = departmentName;
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}