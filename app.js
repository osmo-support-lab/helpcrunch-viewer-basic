const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables from.env file
dotenv.config();

// Create an Express application
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

/**
 * Serve the home page.
 */
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

/**
 * Fetch and return tickets for a specific department.
 * @param {string} departmentId - The ID of the department to filter tickets by.
 * @returns Tickets filtered by the specified department ID.
 */
app.get('/tickets', async (req, res) => {
    const departmentId = req.query.departmentId;
    const url = `https://api.helpcrunch.com/v1/chats/search`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.HC_API_KEY}` },
            body: JSON.stringify({
                filter: [{ field: "chats.department", operator: "=", value: departmentId }],
                sort: "chats.createdAt",
                order: "desc",
                offset: 0,
                limit: 100
            })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch tickets:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Return information about the application.
 * @returns Application information including the department name.
 */
app.get('/app-info', async (req, res) => {
    res.json({ departmentName: process.env.DEPARTMENT_NAME });
});

/**
 * Fetch and return tickets for the department specified in the environment variable.
 * @returns Tickets filtered by the department ID from the environment variable.
 */
app.get('/department-tickets', async (req, res) => {
    const url = `https://api.helpcrunch.com/v1/chats/search`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.HC_API_KEY}` },
            body: JSON.stringify({
                filter: [{ field: "chats.department", operator: "=", value: process.env.DEPARTMENT_ID }],
                sort: "chats.createdAt",
                order: "desc",
                offset: 0,
                limit: 100
            })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch department tickets:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Fetch and return a single ticket by its ID.
 * @param {string} id - The ID of the ticket to retrieve.
 * @returns The requested ticket.
 */
app.get('/ticket/:id', async (req, res) => {
    const url = `https://api.helpcrunch.com/v1/chats/${req.params.id}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${process.env.HC_API_KEY}` }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch ticket:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Fetch and return all messages for a specific chat.
 * @param {string} id - The ID of the chat to retrieve messages for.
 * @returns Messages for the specified chat.
 */
app.get('/chats/:id/messages', async (req, res) => {
    const chatId = req.params.id;
    const url = `https://api.helpcrunch.com/v1/chats/${chatId}/messages`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${process.env.HC_API_KEY}` }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch chat messages:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Send a message to the active ticket.
 * @param {string} message - The message to send.
 * @returns The response from the API.
 */
app.post('/chats/:id/sendMessage', async (req, res) => {
    const chatId = req.params.id;

    // todo: check the HC api for the correct endpoint implementation info


    const url = `https://api.helpcrunch.com/v1/messages`;

    // get message from request body
    const messageText = req.body.text;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                // 'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.HC_API_KEY}`
            },
            body: JSON.stringify({
                text: messageText,
                chat: chatId,
                // "markdownText": "Can you can a **can** as a canner can can a **can**",
                agent: process.env.HC_AGENT_ID,
                type: "message"
            })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Fetch and return all departments.
 * @returns List of all departments.
 */
app.get('/departments', async (req, res) => {
    const url = `https://api.helpcrunch.com/v1/departments`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${process.env.HC_API_KEY}` }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch departments:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
