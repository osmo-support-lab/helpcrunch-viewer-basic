/**
 * Event listener for DOMContentLoaded event to initialize the application.
 */
document.addEventListener('DOMContentLoaded', init);
window.activeTicketId = null;
window.lastActiveTicketId = null;

/**
 * Initialization function triggered on DOMContentLoaded event.
 * Fetches app info, gets tickets for the department, and sets up intervals for refreshing tickets.
 */
async function init() {
    getAppInfo();
    getUserInfo();
    getTicketsForDepartment();
    setInterval(refreshTicketsForDepartment, 30000);
}

/**
 * Refreshes tickets for the department and selected ticket messages.
 */
async function refreshTicketsForDepartment() {
    getTicketsForDepartment();
    refreshSelectedTicketMessages();
}

/**
 * Refreshes selected ticket messages if an active ticket ID is set.
 */
async function refreshSelectedTicketMessages() {
    if (window.activeTicketId) {
        viewTicket(window.activeTicketId);
    }
}

function handleError(error) {
    if (error.status === 401) {
        window.location.href = '/login';
    }
    return;
}

/**
 * Fetches and displays app information such as the department name.
 */
async function getAppInfo() {
    try {
        const response = await fetch('/app-info');
        handleError(response);
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
        handleError(error);
    }
}

/**
 * Fetches and displays user information such as the user name.
 */
async function getUserInfo() {
    try {
        const response = await fetch('/user-info');
        handleError(response);
        if (response.ok) {
            const data = await response.json();
            const name = data.name;
            const elementsWithClassName = document.getElementsByClassName('user-name');
            Array.from(elementsWithClassName).forEach(element => {
                element.innerHTML = name;
            });
        }
    } catch (error) {
        console.error('Error:', error);
        handleError(error);
    }
}

/**
 * Performs a fetch operation with a loading mask applied to a specified element.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {string} elementIdToMask - The ID of the element to apply the loading mask to.
 * @returns {Promise<Response>} The fetch response.
 */
async function loadingMaskFetch(url, options, elementIdToMask) {
    const element = document.getElementById(elementIdToMask);
    element.classList.add('loading');
    let response;
    try {
        response = await fetch(url, options);
        handleError(response);
    } catch (error) {
        console.error('Error:', error);

        handleError(error);
    } finally {
        element.classList.remove('loading');
    }
    return response;
}

/**
 * Fetches and displays tickets for the department.
 */
async function getTicketsForDepartment() {
    try {
        const divTicketList = document.getElementById('divTicketList');
        const response = await loadingMaskFetch(`/department-tickets`, {}, 'ticket-list-loader');
        if (response.ok) {
            const data = await response.json();
            divTicketList.innerHTML = data.data
                .sort((a, b) => b.lastCustomerMessageAt - a.lastCustomerMessageAt)
                .map(ticket => {
                    return `<div class="ticket-preview ${window.activeTicketId == ticket.id ? "active" : ""}" data-ticket-id="${ticket.id}" onclick="viewTicket(${ticket.id},'${ticket.customer?.name}')">
                    <div class="status-color-bar" data-status=${ticket.status}></div>
                    <div class="ticket-info">
                        <div class="ticket-header">
                            <div class="ticket-id">#${ticket.id}</div>
                            <div class="ticket-assignee">Assignee: ${ticket.assignee?.name}</div>
                        </div>                        
                        <div class="ticket-customer">${ticket.customer?.name}</div>
                        <div class="last-message-preview">
                            <div class="last-message-info">
                                <div>Last message:</div>
                                <div class="last-message-timestamp">${new Date(ticket.lastCustomerMessageAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>
                            </div>
                            <div class="last-message-text">${ticket.lastMessageText.includes('ucarecdn.com') ? '🖼️ IMAGE SHARED' : truncateText(ticket.lastMessageText, 50)}</div>
                        </div>
                        <div class="ticket-age">
                            <div class="ticket-created-at">Created ${new Date(ticket.createdAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>
                            <div class="ticket-age-ago">${calculateTicketAge(ticket.createdAt)} ago</div>
                        </div>
                    </div>
                </div>`;
                }).join('');
        } else {
            divTicketList.textContent = 'Error: ' + response.status;
        }
    } catch (error) {
        handleError(error);
        divTicketList.textContent = 'Error: ' + error.message;
    }
}

/**
 * Truncates text to a maximum length.
 * @param {string} text - The text to truncate.
 * @param {number} maxLength - The maximum length of the text.
 * @returns {string} The truncated text.
 */
function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
}

/**
 * Calculates the age of a ticket based on its creation timestamp.
 * @param {number} createdAt - The creation timestamp of the ticket.
 * @returns {string} The age of the ticket in days, hours, and minutes.
 */
function calculateTicketAge(createdAt) {
    const now = new Date();
    const created = new Date(createdAt * 1000);
    const diff = now - created;
    const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffInDays} days, ${diffInHours} hours, ${diffInMinutes} minutes`;
}

// Note: The getDepartments function was commented out in the original code and thus not included here for brevity.

/**
 * Displays detailed information about a selected ticket.
 * @param {number} ticketId - The ID of the ticket to display.
 * @param {string} customerName - The name of the customer associated with the ticket.
 */
function viewTicket(ticketId, customerName = "User") {
    // Check if the current ticketId is the same as the last active ticketId
    if (window.activeTicketId !== ticketId) {
        // If not, reset the active state of all ticket previews
        const ticketPreviews = document.getElementsByClassName('ticket-preview');
        Array.from(ticketPreviews).forEach(ticketPreview => {
            ticketPreview.classList.remove('active');
        });
        // Set the current ticketId as the active one
        window.activeTicketId = ticketId;
        document.querySelector(`.ticket-preview[data-ticket-id="${ticketId}"]`).classList.add('active');
    }

    // Store the current highest message ID if available
    let lastMessageId = null;
    const existingMessages = document.querySelectorAll('.message');
    if (existingMessages.length > 0) {
        lastMessageId = existingMessages[existingMessages.length - 1].getAttribute('data-message-id');
    }

    loadingMaskFetch(`/chats/${ticketId}/messages`, {}, 'ticket-messages-loader')
        .then(response => response.json())
        .then(data => {
            const divTicketMessages = document.getElementById('divTicketMessages');
            const messagesHTML = data.data.reverse().map(message => {
                let isNewMessage = false;
                // Highlight new messages only if the ticketId has not changed

                if (message.from !== 'agent' && window.lastActiveTicketId == ticketId && lastMessageId && message.id > lastMessageId) {
                    isNewMessage = true;
                }
                if (validateImageURL(message.text)) {
                    message.text = `<a href="${message.text}" target="_blank"><img src="${message.text}" alt="Image"></a>`;
                } else
                    if (validateUUID(message.text)) {
                        message.text = `<a href="https://ucarecdn.com/${message.text}/" target="_blank"><img src="https://ucarecdn.com/${message.text}/" alt="Image"></a>`;
                    }
                let messageClass = `message ${message.from === 'agent' ? (message.agent?.name === undefined ? 'system' : 'agent') : 'customer'} ${isNewMessage ? 'new-message' : ''}`;
                return `<div class="${messageClass}" data-message-id="${message.id}">
                            <div class="message-sender">${message.from === 'agent' ? (message.agent?.name === undefined ? "System message" : message.agent.name) : customerName}</div>
                            <div class="message-text">${message.text}</div>
                            <div class="message-timestamp">${new Date(message.updatedAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })}</div>
                        </div>`;
            }).join('');

            divTicketMessages.innerHTML = messagesHTML; // Render messages

            // Update the last active ticketId
            window.lastActiveTicketId = ticketId;

            // Scroll to the bottom of the messages container
            requestAnimationFrame(() => {
                divTicketMessages.scrollTop = divTicketMessages.scrollHeight;
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}



/**
 * Validates if a given string is a URL to an image.
 * @param {string} text - The string to validate.
 * @returns {string} The image URL if valid, null otherwise.
 */
function validateImageURL(text) {
    const regex = /https:\/\/ucarecdn\.com\/.*\/image\.(jpg|jpeg|png|gif)/i;
    const match = text.match(regex);
    return match ? match[0] : null;
}

/**
 * Validates if a given string is a UUID.
 * @param {string} uuid - The string to validate.
 * @returns {boolean} True if the string is a valid UUID, false otherwise.
 */
function validateUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}



// on inputMessage textarea resize, adjust divTicketMessages size:
document.getElementById('inputMessage').addEventListener('resize', function () {
    document.getElementById('divTicketMessages').style.height = `calc(100vh - (150px +  ${this.scrollHeight}px))`;
});


/**
 * Sends a message to the selected ticket.
 */

async function sendMessage() {
    const message = document.getElementById('inputMessage').value;
    if (!window.activeTicketId || !message || message.trim() === '') {
        return;
    }
    try {
        const response = await fetch(`/chats/${window.activeTicketId}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: message })
        });
        if (response.ok) {
            viewTicket(window.activeTicketId);
        } else {

            handleError(response);
            console.error('Failed to send message:', response.status);
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message. Please try again.');

        handleError(error);
    }
    finally {
        document.getElementById('inputMessage').value = '';
    }
}


// listener to send message on CTRL+Enter key press:
document.getElementById('inputMessage').addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'Enter') {
        sendMessage();
    }
});

// listener to send message on click of send button:
document.getElementById('btnSend').addEventListener('click', sendMessage);

// refresh button
document.getElementById('btnRefreshTickets').addEventListener('click', refreshTicketsForDepartment);