const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const session = require('express-session'); // Added session support
const { exec } = require('child_process');

const app = express();

// Path to the JSON file where user data will be stored
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// Ensure the data directory and users.json file exist
const dataDir = path.dirname(usersFilePath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, '[]', 'utf8');
}

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // To parse JSON bodies

// Session setup
app.use(session({
    secret: 'your_secret_key', // Replace with a strong secret in production
    resave: false,
    saveUninitialized: true,
}));

// Serve index.ejs
app.get('/', (req, res) => {
    res.render('index'); // Render the EJS file
});

// Signup route
app.post('/signup', (req, res) => {
    const { name, branch, password, year, college } = req.body;

    // Read existing users from the JSON file
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return res.status(500).send('Error reading user data.');
        }

        const users = data ? JSON.parse(data) : [];
        const newUser = { name, branch, password, year, college };

        // Add the new user to the array
        users.push(newUser);

        // Write updated users back to the JSON file
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error('Error saving user data:', err);
                return res.status(500).send('Error saving user data.');
            }

            // Store the username in the session immediately after signup
            req.session.username = name;

            res.redirect('/select-language'); // Redirect to select-language.ejs
        });
    });
});

// Sign In route
app.post('/signin', (req, res) => {
    const { name, password } = req.body;

    // Read existing users from the JSON file
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return res.status(500).send('Error reading user data.');
        }

        const users = JSON.parse(data);
        const user = users.find(user => user.name === name && user.password === password);

        if (user) {
            // Store the username in the session after successful sign-in
            req.session.username = name;
            res.redirect('/select-language'); // Redirect to select-language.ejs
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

// Serve select-language.ejs
app.get('/select-language', (req, res) => {
    // Check if the user is signed in by checking session data
    const username = req.session.username;

    if (!username) {
        return res.redirect('/'); // Redirect to homepage if not signed in
    }

    res.render('select-language', { username }); // Pass the username to the template
});

// Serve compiler page
app.get('/compiler/:language', (req, res) => {
    const { language } = req.params;
    const username = req.session.username;

    // Redirect to home if not logged in
    if (!username) {
        return res.redirect('/');
    }

    // Read user data from the JSON file
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return res.status(500).send('Error reading user data.');
        }

        let currentUser;
        try {
            const users = JSON.parse(data);
            currentUser = users.find(user => user.name === username);
            
            if (!currentUser) {
                console.error('User not found:', username);
                return res.status(404).send('User not found.');
            }
        } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            return res.status(500).send('Error parsing user data.');
        }

    const problems = {
        'c': [
            'Write a C program to reverse a string.',
            'Write a C program to find the largest number in an array.',
            'Write a C program to check if a number is prime.',
            'Write a C program to sort an array using bubble sort.',
            'Write a C program to calculate the factorial of a number.',
            'Write a C program to swap two numbers without using a temporary variable.',
            'Write a C program to find the GCD of two numbers.',
            'Write a C program to check if a number is even or odd.',
            'Write a C program to find the sum of digits of a number.',
            'Write a C program to print the Fibonacci sequence up to n terms.'
        ],
        'python': [
            'Write a Python function to check if a string is a palindrome.',
            'Write a Python function to find the factorial of a number.',
            'Write a Python function to reverse a string.',
            'Write a Python program to check if a number is prime.',
            'Write a Python function to find the largest number in a list.',
            'Write a Python program to sort a list using bubble sort.',
            'Write a Python function to check if a number is even or odd.',
            'Write a Python function to calculate the sum of digits of a number.',
            'Write a Python program to print the Fibonacci sequence up to n terms.',
            'Write a Python function to find the GCD of two numbers.'
        ],
        'java': [
            'Write a Java method to calculate the factorial of a number.',
            'Write a Java method to check if a number is prime.',
            'Write a Java method to reverse a string.',
            'Write a Java program to sort an array using bubble sort.',
            'Write a Java method to find the largest number in an array.',
            'Write a Java method to check if a string is a palindrome.',
            'Write a Java program to find the GCD of two numbers.',
            'Write a Java program to print the Fibonacci sequence up to n terms.',
            'Write a Java method to check if a number is even or odd.',
            'Write a Java method to swap two numbers without using a temporary variable.'
        ]
    };

    const problemList = problems[language];
    const randomProblem = problemList[Math.floor(Math.random() * problemList.length)];

    res.render('compiler', { language, problem: randomProblem, problems: problemList,user: currentUser });
});
});


// Handle code submission with grading
app.post('/submit', (req, res) => {
    const { language, code } = req.body;

    const ext = language === 'c' ? 'c' : language === 'python' ? 'py' : 'java';
    const fileName = `temp.${ext}`;
    const filePath = path.join(__dirname, 'temp', fileName);

    if (!fs.existsSync(path.join(__dirname, 'temp'))) {
        fs.mkdirSync(path.join(__dirname, 'temp'));
    }

    fs.readdir(path.join(__dirname, 'temp'), (err, files) => {
        if (err) {
            console.error('Error reading temp directory:', err);
            return res.status(500).send('Error reading temp directory.');
        }

        // Remove old files from the temp directory
        files.forEach(file => {
            fs.unlink(path.join(__dirname, 'temp', file), err => {
                if (err) {
                    console.error('Error deleting old file:', err);
                }
            });
        });

        // Write the new code to a file
        fs.writeFile(filePath, code, (err) => {
            if (err) {
                console.error('Error saving code:', err);
                return res.status(500).send('Error saving code.');
            }

            let command;
            switch (language) {
                case 'c':
                    command = `gcc -o temp "${filePath}" && ./temp`; // Ensure the output file is executed
                    break;
                case 'python':
                    command = `python "${filePath}"`;
                    break;
                case 'java':
                    command = `javac "${filePath}" && java -cp temp ${path.basename(filePath, '.java')}`;
                    break;
                default:
                    return res.status(400).send('Unsupported language');
            }

            // Execute the code and simulate grading
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Execution error: ${stderr}`);
                    return res.status(500).send(`Execution error: ${stderr}`);
                }

                // Simulate a score between 0 and 100
                const score = Math.floor(Math.random() * 101);

                // Determine grade based on score
                let grade;
                if (score >= 85) {
                    grade = 'A';
                } else if (score >= 70) {
                    grade = 'B';
                } else {
                    grade = 'C';
                }

                // Send the output along with the grade
                res.send(`
                   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Submission Result</title>
    <style>
        body {
            background-color: #000;
            color: #fff;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
        }
        .container {
            display: inline-block;
            background-color: #222;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.5);
        }
        h1 {
            color: #f0ad4e;
        }
        pre {
            text-align: left;
            background-color: #333;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .score {
            font-size: 24px;
            color: #5bc0de;
        }
        .grade {
            font-size: 28px;
            color: #d9534f;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Submission Result</h1>
        <pre>${stdout}</pre>
        <p class="score">Score: ${score}</p>
        <p class="grade">Grade: ${grade}</p>
        <a href="/select-language" style="text-decoration: none; color: #5bc0de;">Go Back to Language Selection</a>
    </div>
</body>
</html>
                `);
            });
        });
    });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
