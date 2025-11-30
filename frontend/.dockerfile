FROM node:20-slim

WORKDIR /app

# Copy package files first for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 3000

# Run Next.js dev server
CMD ["npm", "run", "dev"]