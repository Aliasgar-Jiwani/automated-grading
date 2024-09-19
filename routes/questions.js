const express = require('express');
const router = express.Router();

// Array of sample questions for each language
const questions = {
    c: [
        "Write a C program to reverse a string.",
        "Implement a C program to find the largest number in an array.",
        "Create a C program to calculate the factorial of a number."
    ],
    python: [
        "Write a Python function to check if a string is a palindrome.",
        "Implement a Python function to return the Fibonacci sequence up to n.",
        "Create a Python script to sort a list of tuples by the second element."
    ],
    java: [
        "Write a Java program to find the sum of all elements in a matrix.",
        "Implement a Java program to check if a number is prime.",
        "Create a Java class to simulate a simple banking system."
    ]
};

// Route to handle random question display
router.get('/:language', (req, res) => {
    const language = req.params.language.toLowerCase();
    const questionList = questions[language];

    if (questionList) {
        const randomQuestion = questionList[Math.floor(Math.random() * questionList.length)];
        res.render('compiler', { language, question: randomQuestion });
    } else {
        res.status(404).send('Language not supported');
    }
});

module.exports = router;
