# Hardcoded number
number = 12345

# Initialize sum to 0
sum_of_digits = 0

# Convert the number to a string to iterate over each digit
for digit in str(number):
    sum_of_digits += int(digit)

# Output the result
print("The sum of the digits is:", sum_of_digits)
