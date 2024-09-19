const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
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
            res.redirect('/select-language'); // Redirect to select-language.ejs
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

// Serve select-language.ejs
app.get('/select-language', (req, res) => {
    res.render('select-language'); // Ensure this file exists in views
});

// Serve compiler page
app.get('/compiler/:language', (req, res) => {
    const { language } = req.params;
    
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
    const note = language === 'java' ? 'Note: The class name should be "temp".' : '';

    res.render('compiler', { language, problem: randomProblem, note });
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
                    command = `gcc -o temp "${filePath}" && temp`;  // Ensure output file is temp.exe
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
                } else if (score >= 50) {
                    grade = 'C';
                } else {
                    grade = 'Fail';
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
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            max-width: 800px;
            width: 100%;
            text-align: left;
        }
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #ddd;
            overflow-x: auto;
            font-family: monospace;
            color: #333;
            margin-bottom: 20px;
            word-wrap: break-word;
        }
        p {
            font-size: 18px;
            margin: 10px 0;
        }
        .score {
            font-weight: bold;
            color: #fff;
        }
        .grade {
            font-size: 16px;
            color: ${grade === 'Fail' ? '#d9534f' : '#5bc0de'};
        }
    </style>
</head>
<body>
    <div class="container">
        <pre>${stdout}</pre>
        <p class="score">Score: ${score}%</p>
        <p class="grade">Grade: ${grade}</p>
    </div>
</body>
</html>

                `);
            });
        });
    });
});


// Start the server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
