// Get the reference to the button and output div
// const btnGetTickets = document.getElementById('btnGetTickets');

// const selectDepartments = document.getElementById('selectDepartments');

// // Add event listener to the buttons
// document.getElementById('btnGetTickets').addEventListener('click', () => {
//     getTicketsByDepartmentId(selectDepartments.value);
// });

// document.getElementById('btnGetSquidTickets').addEventListener('click', async () => {
//     getTicketsByDepartmentId(142160);
// });

document.getElementById('btnRefreshTickets').addEventListener('click', async () => {
    getTicketsForDepartment();
});

// document.getElementById('btnGetDepartments').addEventListener('click', () => {
//     getDepartments();
// });

document.addEventListener('DOMContentLoaded', init);

async function init() {
    getAppInfo();
    getTicketsForDepartment();
    setInterval(getTicketsForDepartment, 60000);
}

async function getAppInfo() {
    try {
        const response = await fetch('/app-info');
        if (response.ok) {
            const data = await response.json();
            const departmentName = data.departmentName;

            // document.getElementById('departmentName').textContent = departmentName;

            const elementsWithClassName = document.getElementsByClassName('department-name');
            Array.from(elementsWithClassName).forEach(element => {
                element.innerHTML = departmentName;
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadingMaskFetch(url, options, elementIdToMask) {
    // apply loading mask
    const element = document.getElementById(elementIdToMask);
    element.classList.add('loading');
    let response;
    try {
        response = await fetch(url, options);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // remove loading mask
        element.classList.remove('loading');
    }
    return response;

}

async function getTicketsForDepartment() {
    try {
        const divTicketList = document.getElementById('divTicketList');
        // Make a GET request to the root ticket endpoint



        const response = await loadingMaskFetch(`/department-tickets`, {}, 'ticket-list-loader');

        // Check if the request was successful
        if (response.ok) {
            // Get the response data as JSON
            const data = await response.json();


            // for each ticket in the data.data array, display the ticket id and the first message
            divTicketList.innerHTML = data.data
                .sort((a, b) => b.lastCustomerMessageAt - a.lastCustomerMessageAt) // Sort tickets by last message time (newest to oldest)
                .map(ticket => {
                    return `<div class="ticket-preview" onclick="viewTicket(${ticket.id},'${ticket.customer?.name}')">
                    <div class="status-color-bar" data-status=${ticket.status}></div>
                    <div class="ticket-info">
                        <div class="ticket-header">
                            <div class="ticket-id">#${ticket.id}</div>
                            <div class="ticket-assignee">Assignee: ${ticket.assignee?.name}</div>
                        </div>                        
                        <!--<div class="ticket-status">Status: ${ticket.status} ${ticket.status === 'opened' ? '🟢' : ticket.status === 'closed' ? '🔴' : '🟡'}</div>--> 
                        <div class="ticket-customer">${ticket.customer?.name}</div>
                        <div class="last-message-preview">
                            <div class="last-message-info">
                                <div>Last message:</div>
                                <div class="last-message-timestamp">${new Date(ticket.lastCustomerMessageAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>
                            </div>
                            <div class="last-message-text">${truncateText(ticket.lastMessageText, 50)}</div>
                        </div>
                        <div class="ticket-age">
                            <div class="ticket-created-at">Created ${new Date(ticket.createdAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>
                            <div class="ticket-age-ago">${calculateTicketAge(ticket.createdAt)} ago</div>
                        </div>
                        <!--<div class="ticket-department">Department: ${ticket.department?.name}</div>-->
                        
                        <!--<div class="ticket-last-customer-message-at">Last Customer Message At: ${new Date(ticket.lastCustomerMessageAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>-->
                    </div>
                </div>`;
                }).join('');
        } else {
            // Display an error message if the request was not successful
            divTicketList.textContent = 'Error: ' + response.status;
        }
    } catch (error) {
        // Display an error message if there was an error with the request
        divTicketList.textContent = 'Error: ' + error.message;
    }
}
function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
}

function calculateTicketAge(createdAt) {
    const now = new Date();
    const created = new Date(createdAt * 1000);
    const diff = now - created;
    const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffInDays} days, ${diffInHours} hours, ${diffInMinutes} minutes`;
}


async function getDepartments() {
    try {
        // Make a GET request to the root departments endpoint
        const response = await fetch('/departments');

        // Check if the request was successful
        if (response.ok) {
            // Get the response data as JSON
            const data = await response.json();

            // only show the id and name property for each item in the data.data array
            const departments = data.data.map(department => {
                return {
                    id: department.id,
                    name: department.name
                };
            });

            //update selectDepartments with the departments
            selectDepartments.innerHTML = departments.map(department => {
                return `<option value="${department.id}">${department.name}</option>`;
            }).join('');

        } else {
            // Display an error message if the request was not successful
            divDepartmentsResponse.textContent = 'Error: ' + response.status;
        }
    } catch (error) {
        // Display an error message if there was an error with the request
        divDepartmentsResponse.textContent = 'Error: ' + error.message;
    }
}



function viewTicket(ticketId, customerName = "User") {

    loadingMaskFetch(`/chats/${ticketId}/messages`, {}, 'ticket-messages-loader')
        .then(response => response.json())
        .then(data => {
            // Display the messages in the divTicketMessages
            console.log(data);
            document.getElementById('divTicketMessages').innerHTML = data.data.map(message => {
                return `<div class="message">
                            <div class="message-text">${message.text}</div>
                            <div class="message-info">
                                <div class="message-sender">${message.from === 'agent' ? (message?.agent?.name === undefined ? "System message" : message?.agent?.name) : customerName}</div>
                                <div class="message-timestamp">${new Date(message.updatedAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })}</div>
                            </div>
                        </div>`;
            }).join('');
        })
        .catch(error => {
            console.error('Error:', error);
        });

}
