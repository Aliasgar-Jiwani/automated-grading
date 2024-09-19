def is_palindrome(s):
    # Remove spaces and convert to lowercase for consistent comparison
    s = s.replace(" ", "").lower()
    # Compare the string with its reverse
    return s == s[::-1]

# Example usage:
result = is_palindrome("radar")
print(result)  # Output: True
