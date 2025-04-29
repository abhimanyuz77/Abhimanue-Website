# Get input from the user
num1 = float(input("Enter the first number: "))
num2 = float(input("Enter the second number: "))

# Add the numbers
sum_result = num1 + num2

# Multiply the sum by each of the original numbers
final_result = sum_result * num1 * num2

# Display the results
print(f"The sum of {num1} and {num2} is: {sum_result}")
print(f"The result of ({num1} + {num2}) * {num1} * {num2} is: {final_result}")