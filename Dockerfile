FROM node:22-bookworm

# Install Python and pip
RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Fail the build loudly here if python3 isn't actually on PATH after install,
# instead of discovering it later via a silent runtime ENOENT.
RUN which python3 && python3 --version

WORKDIR /app

COPY . .

RUN npm install --prefix backend

RUN pip3 install --no-cache-dir --break-system-packages \
    -r scraper/requirements.txt

RUN mkdir -p /app/data

# Use the full absolute path so Node's child_process.spawn can never fail
# to resolve it, regardless of PATH differences at runtime vs build time.
ENV PYTHON_BIN=/usr/bin/python3

EXPOSE 4000

CMD ["npm", "start", "--prefix", "backend"]