const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables from .env file
dotenv.config();

// Create an Express application
const app = express();

// Set up a route for the home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
    // it should also serve the public folder
    app.use(express.static('public'));
});

// handle request to get all tickets
app.get('/tickets', async (req, res) => {
    // get the departmentId from the query parameters
    const departmentId = req.query.departmentId;
    const url = `https://api.helpcrunch.com/v1/chats/search`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HC_API_KEY}`
        },
        body: JSON.stringify({
            "filter": [
                {
                    "field": "chats.department",
                    "operator": "=",
                    "value": departmentId
                }
            ],
            "sort": "chats.createdAt",
            "order": "desc",
            "offset": 0,
            "limit": 100
        })
    });
    const data = await response.json();
    res.json(data);
});

app.get('/app-info', async (req, res) => {
    res.json({departmentName: process.env.DEPARTMENT_NAME});
});

// get ticket by department id from .env
app.get('/department-tickets', async (req, res) => {
    const url = `https://api.helpcrunch.com/v1/chats/search`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HC_API_KEY}`
        },
        body: JSON.stringify({
            "filter": [
                {
                    "field": "chats.department",
                    "operator": "=",
                    "value": process.env.DEPARTMENT_ID
                }
            ],
            "sort": "chats.createdAt",
            "order": "desc",
            "offset": 0,
            "limit": 100
        })
    });
    const data = await response.json();
    res.json(data);
});

// handle request to get a single ticket
app.get('/ticket/:id', async (req, res) => {
    const url = `https://api.helpcrunch.com/v1/chats/${req.params.id}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.HC_API_KEY}`
        }
    });
    const data = await response.json();
    res.json(data);
});

// handle request to get all messages for a chat
app.get('/chats/:id/messages', async (req, res) => {
    const chatId = req.params.id;
    const url = `https://api.helpcrunch.com/v1/chats/${chatId}/messages`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.HC_API_KEY}`
        }
    });
    const data = await response.json();
    res.json(data);
});

// handle request to get all departments
app.get('/departments', async (req, res) => {
    const url = `https://api.helpcrunch.com/v1/departments`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.HC_API_KEY}`
        }
    });
    const data = await response.json();
    res.json(data);
});
            


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});