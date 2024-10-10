const logoutButton = document.getElementById('logout');
const addButton = document.getElementById('addButton');
logoutButton.style.display = 'none';
addButton.style.display = 'none';
const form = document.getElementById('login-form');
const loginSection = document.getElementById('loginSection');
const users = document.getElementById('users');
const loggedInConatiner = document.querySelector('.loggedInConatiner');
const addForm = document.getElementById('add-form');
const updateForm = document.getElementById('update-form');
const back = document.getElementById('back');

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        showLoggedInState();
    } else {
        showLoggedOutState();
    }
});

async function fetchPageData(page) {
    const response = await fetch(`https://reqres.in/api/users?page=${page}`);
    const data = await response.json();
    console.log('Page data:', data);
    return data;
}

// Fetch all pages
async function fetchAllData() {
    console.log('Fetching all data');
    const allData = [];
    let page = 1;
    let totalPages;
    do {
        const data = await fetchPageData(page);
        allData.push(...data.data);
        totalPages = data.total_pages;
        page++;
    } while (page <= totalPages);
    
    // Store users in localStorage
    localStorage.setItem('users', JSON.stringify(allData));
    return allData;
}

// Initialize DataTable
$(document).ready(function() {
    $('#usersTable').DataTable();
});

// handle update
async function handleUpdate(e) {
    e.preventDefault();
    const id = document.getElementById('user_id').value;
    const first_name = document.getElementById('first_name').value;
    const last_name = document.getElementById('last_name').value;
    const email = document.getElementById('user_email').value;
    const updatedAt = document.getElementById('updatedAt');

    const response = await fetch(`https://reqres.in/api/users/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            first_name: first_name,
            last_name: last_name,
            email: email,
        }),
    });

    if (response.status === 200) {
        const data = await response.json();
        updatedAt.value = data.updatedAt;
        console.log('User updated successfully:', data);
        displayData();
    }
}

// Update user data
async function updateUserData(id) {
    addForm.style.display = 'none';
    updateForm.style.display = 'block';
    const newUserFromLocalStorage = JSON.parse(localStorage.getItem('newUsers')) || [];
    const findUser = newUserFromLocalStorage.find(user => user.id === String(id));          
    if (findUser) {
        document.getElementById('user_id').value = findUser.id;
        document.getElementById('first_name').value = findUser.first_name;
        document.getElementById('last_name').value = findUser.last_name;
        document.getElementById('user_email').value = findUser.email;
    } else {
        const response = await fetch(`https://reqres.in/api/users/${id}`);
        const data = await response.json();
        document.getElementById('user_id').value = data.data.id;
        document.getElementById('first_name').value = data.data.first_name;
        document.getElementById('last_name').value = data.data.last_name;
        document.getElementById('user_email').value = data.data.email;
    }
}

async function deleteUser(id) {
    const newUsersFromLocalStorage = JSON.parse(localStorage.getItem('newUsers')) || [];
    const findUser = newUsersFromLocalStorage.find(user => user.id === String(id));
    if (findUser) {
        const newUsers = newUsersFromLocalStorage.filter(user => user.id !== String(id));
        localStorage.setItem('newUsers', JSON.stringify(newUsers));
        displayData();
        return;
    } else {
        try {
            const response = await fetch(`https://reqres.in/api/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 204) {
                console.log('User deleted successfully');
                const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers')) || [];
                deletedUsers.push(id); // Store the user data
                localStorage.setItem('deletedUsers', JSON.stringify(deletedUsers));
                displayData();
            } else {
                console.log('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
}

// Populate DataTable with user data
function populateUserTable(usersData) {
    const table = $('#usersTable').DataTable();
    table.clear();
    usersData.forEach(user => {
        table.row.add([
            user.first_name,
            user.last_name,
            user.email,
            `<img class="avatar" src="${user.avatar}">`,
            `<button class="btn btn-primary" onClick="updateUserData(${user.id})">Edit</button>`,
            `<button class="btn btn-danger" onClick="deleteUser(${user.id})">Delete</button>`,
            `<img src="${user.avatar}" alt="Avatar" width="50" height="50">`
        ]).draw();
    });
}

// Add new user
async function addNewUser(e) {
    e.preventDefault();
    const userId = document.getElementById('add_user_id');
    const first_name = document.getElementById('add_first_name').value;
    const last_name = document.getElementById('add_last_name').value;
    const email = document.getElementById('add_user_email').value;

    const response = await fetch('https://reqres.in/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            first_name: first_name,
            last_name: last_name,
            email: email,
            avatar: './images/z.png',
        }),
    });

    if (response.status === 201) {
        const data = await response.json();
        userId.value = data.id;
        const newUsers = JSON.parse(localStorage.getItem('newUsers')) || [];
        newUsers.push(data);
        localStorage.setItem('newUsers', JSON.stringify(newUsers));
        displayData();
        addForm.reset();
        addForm.style.display = 'none';
        const newElement = document.createElement('div');
        document.getElementById('loggedInMessage').appendChild(newElement);
        newElement.classList.add('alert', 'alert-success');
        newElement.appendChild(document.createTextNode('User added successfully'));
         
        setTimeout(() => {
            newElement.classList.add('hidden');
            newElement.remove();
        }, 3000);
    }
}

// Show all data 
async function displayData() {
    const data = await fetchAllData();
    //const data = JSON.parse(localStorage.getItem('users')) || [];
    const newUsers = JSON.parse(localStorage.getItem('newUsers')) || [];
    const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers')) || [];
    const allUsers = [...data, ...newUsers];
    console.log('All users:', allUsers);
    const filteredUsers = allUsers.filter(user => user && !deletedUsers.includes(user.id));
    populateUserTable(filteredUsers);
}

// Show logged out state
function showLoggedOutState() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('users');
    localStorage.removeItem('newUsers');
    localStorage.removeItem('deletedUsers');
    loginSection.style.display = 'block';
    form.style.display = 'block';
    logoutButton.style.display = 'none';
    addButton.style.display = 'none';
    loggedInConatiner.style.display = 'none';
    
}

// Show logged in state
function showLoggedInState() {
    const token = localStorage.getItem('token');
    if (token) {
        loginSection.style.display = 'none';
        logoutButton.style.display = 'block';
        addButton.style.display = 'block';
        const email = localStorage.getItem('email');
        loggedInMessage.textContent = '';
        document.getElementById('loggedInMessage').appendChild(document.createTextNode(`Hi ${email}`));
        loggedInConatiner.style.display = 'block';
        displayData();
    }
}

// Handle login form submit
async function handleFormSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const response = await fetch('https://reqres.in/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    
    if (response.status === 200) {
        const data = await response.json();
        if (email === 'eve.holt@reqres.in' && password === 'cityslicka') {
            if (data.token === 'QpwL5tke4Pnpja7X4') {
                localStorage.setItem('token', data.token);
                localStorage.setItem('email', email);
                showLoggedInState();
                form.reset();
            } else {
                alert('Invalid token');
            }
        } else {
            alert('Invalid email or password');
        }
    } else {
        const errorData = await response.json();
        if (response.status === 400) {
            const emailError = document.getElementById('email');
            if (errorData.error === 'Missing password') {
                alert('Missing password');
            } else if (errorData.error === 'Missing email or username') {
                alert('Missing email');
            } else {
                alert('Invalid email or password');
            }
        } else {
            alert('An unexpected error occurred');
        }
    }
}

// Login form validation
function validateLoginForm() {
    const email = document.getElementById('email').value;
    const emailError = document.getElementById('email');
    const password = document.getElementById('password').value;
    if (email === '' || password === '') {
        const newElement = document.createElement('div');
        emailError.appendChild(newElement);
        newElement.classList.add('alert', 'alert-danger');
        newElement.appendChild(document.createTextNode('Email and password are required'));
        return false;
    }
    return true;
}

// Add event listener to add button
addButton.addEventListener('click', () => {
    addForm.style.display = 'block';
    updateForm.style.display = 'none';
});

// Add event listener to back button
back.addEventListener('click', () => {
    updateForm.style.display = 'none';
});

// Add event listener to form
form.addEventListener('submit', handleFormSubmit);

// Add event listener to logout button
logoutButton.addEventListener('click', showLoggedOutState);

// add form event listener
addForm.addEventListener('submit', addNewUser);
 
// update form event listener
updateForm.addEventListener('submit', handleUpdate);

 