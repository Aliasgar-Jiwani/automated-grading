const express = require('express');
const router = express.Router();

let users = []; // This will temporarily store registered users

// Render the registration page
router.get('/register', (req, res) => {
    res.render('register');
});

// Handle the registration form submission
router.post('/register', (req, res) => {
    const { name, branch, year, college } = req.body;

    // Ensure all fields are filled out
    if (!name || !branch || !year || !college) {
        return res.status(400).send('All fields are required!');
    }

    // Save the user details
    users.push({ name, branch, year, college });
    console.log('Registered Users:', users);

    // Redirect to the login page after successful registration
    res.redirect('/login');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
    // Authentication logic here

    // If authentication is successful, render the language selection page
    res.redirect('/select-language');
});

router.get('/select-language', (req, res) => {
    res.render('select-language');
});

module.exports = router;
