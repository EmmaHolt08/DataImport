# Use an official Python runtime as a parent image
FROM python:3.11-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY . .

# Expose the port that Uvicorn will run on
EXPOSE 80

# Command to run the application using Uvicorn
CMD ["uvicorn", "code.awesome-project.main:app", "--host", "0.0.0.0", "--port", "80"]