require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const path = require('path');

// Constants
const USERS = require('./users.json').users;
const SECRET = process.env.SECRET;
const SESSION_AGE = process.env.SESSION_AGE;
const PORT = process.env.PORT;

const app = express();

app.use(session({
    secret: SECRET,
    cookie: { maxAge: Number(SESSION_AGE) },
    resave: false,
    saveUninitialized: true,
}));

app.use(express.json());

// Middleware to check if the user is logged in
const isLoggedInJSON = (req, res, next) => {
    console.log("isLoggedInJSON");
    if (!req.session.loggedin) {
        return res.status(401).json({ success: false, message: 'Please log in.' });
    }
    next();
};

const isLoggedInReq = (req, res, next) => {
    console.log("isLoggedInReq");
    if (!req.session.loggedin) {
        return res.redirect('/login'); // Redirect to login page instead of returning JSON
    }
    next();
};

app.get('/', isLoggedInReq, (req, res) => {
    res.redirect('/index');
});

app.get('/index', isLoggedInReq, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', isLoggedInReq, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.use(express.static(path.join(__dirname, 'public')));

function handleLoginAttempt(req) {
    console.log("handleLoginAttempt");
    req.session.firstAttempt = req.session.firstAttempt || Date.now();
    req.session.latestAttempt = Date.now();
    req.session.attempts = req.session.attempts ? req.session.attempts + 1 : 1;

    // Check if 1 minute has passed since the first attempt, if so, reset the attempts
    if (req.session.attempts >= 5) {
        if (req.session.latestAttempt - req.session.firstAttempt < 60000) {
            req.session.blocked = true;
        } else {
            req.session.firstAttempt = Date.now();
            req.session.attempts = 1;
            req.session.blocked = false;
        }
        return;
    }
};

app.post('/do-login', async (req, res) => {
    try {

        handleLoginAttempt(req);

        if (req.session.blocked) {
            // return html error code 429, signifying too many requests
            return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.' });
        }

        const { username, password } = req.body;

        if (!username || !password) {
            // return html error code 400, signifying a bad request
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        let user = USERS.find(u => u.username === username);

        if (!user) {
            // return html error code 401, signifying unauthorized access
            return res.status(401).json({ success: false, message: 'User not found or incorrect password' });
        }

        const match = await bcrypt.compare(password, user.hashedPassword);

        if (!match) {
            // return html error code 401, signifying unauthorized access
            return res.status(401).json({ success: false, message: 'User not found or incorrect password' });
        }

        req.session.user = { username: user.username, name: user.name };
        req.session.loggedin = true;

        res.json({ success: true });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ success: false, message: 'An error occurred during login.' });
    }
});


// endpoint to get user session info
app.get('/user-info', isLoggedInJSON, (req, res) => {
    res.json(req.session.user);
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});


app.get('/tickets', isLoggedInJSON, async (req, res) => {
    try {
        const departmentId = req.query.departmentId;
        const url = `https://api.helpcrunch.com/v1/chats/search`;
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

app.get('/app-info', async (req, res) => {
    res.json({ departmentName: process.env.DEPARTMENT_NAME });
});

app.get('/department-tickets', isLoggedInJSON, async (req, res) => {
    try {
        const url = `https://api.helpcrunch.com/v1/chats/search`;
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

app.get('/ticket/:id', isLoggedInJSON, async (req, res) => {
    try {
        const url = `https://api.helpcrunch.com/v1/chats/${req.params.id}`;
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

app.get('/chats/:id/messages', isLoggedInJSON, async (req, res) => {
    try {
        const chatId = req.params.id;
        const url = `https://api.helpcrunch.com/v1/chats/${chatId}/messages`;
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

app.post('/chats/:id/sendMessage', isLoggedInJSON, async (req, res) => {
    const chatId = req.params.id;
    let messageText = req.body.text;
    let isPrivate = !!req.body.isPrivate;
    const messageSenderName = req.session.user.name;

    messageText = `${messageText}
    
~ ${messageSenderName}`;

    try {
        const url = `https://api.helpcrunch.com/v1/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HC_API_KEY}`
            },
            body: JSON.stringify({
                text: messageText,
                chat: chatId,
                agent: process.env.HC_AGENT_ID,
                type: isPrivate ? "private" : "message"
            })
        });
        const data = await response.json();
        console.log(data)
        res.json(data);
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/departments', isLoggedInJSON, async (req, res) => {
    try {
        const url = `https://api.helpcrunch.com/v1/departments`;
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
