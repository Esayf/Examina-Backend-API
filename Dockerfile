# Use the official Bun image
FROM oven/bun:1

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json bun.lockb ./

# install build-essential required for some packages (redis-memory-server)
RUN apt-get update && apt-get install -y build-essential

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 8000