# Node.js environment for building and running the Vite app
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project source code
COPY . .

# Expose Vite default dev server port
EXPOSE 5173

# Start development server binding to all network interfaces for container access
CMD ["npm", "run", "dev", "--", "--host"]
