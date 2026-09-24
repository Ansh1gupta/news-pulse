
FROM node:22-bookworm

# Install Python and pip
RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire project
COPY . .

# Install Node dependencies
RUN npm install --prefix backend

# Install Python dependencies
RUN pip3 install --no-cache-dir --break-system-packages \
    -r scraper/requirements.txt

# Make sure the data directory exists
RUN mkdir -p /app/data

# Python executable for the Node ingestion route
ENV PYTHON_BIN=python3

# Render provides PORT automatically
EXPOSE 4000

# Start Node backend
CMD ["npm", "start", "--prefix", "backend"]

