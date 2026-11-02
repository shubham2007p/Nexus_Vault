# Nexus Vault — Production Architecture & Deployment Guide

This document defines the production hosting topology, security configuration, containerization, and disaster recovery strategy for **Nexus Vault**.

---

## 1. System Topology Overview

```
                      +-----------------------------+
                      |   Public Internet / HTTPS   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Caddy / Nginx Edge Proxy  |
                      |   (SSL Termination, Gzip)   |
                      +--------------+--------------+
                                     |
                         localhost:3001 (HTTP)
                                     v
                      +-----------------------------+
                      |   Nexus Vault Node.js App   |
                      |  - Express REST / SSE API   |
                      |  - Vite SPA Static Bundle   |
                      +-------+--------------+------+
                              |              |
                read/write    |              | mirror sync
                              v              v
               +--------------------+   +-------------------+
               |  SQLite 3 (WAL)    |   | Disk File Vault   |
               |  - vault.db        |   | - raw/*.md        |
               |  - FTS5 Index      |   | - process/*.md    |
               +--------------------+   +-------------------+
```

### Core Design Principles
1. **Zero-Latency Local Persistence:** Embedded SQLite 3 with FTS5 eliminates database connection overhead, network latency, and multi-service failure cascades.
2. **Transparent File-System Mirroring:** The `raw/` and `process/` directories are physical Markdown files on disk, allowing standard CLI tools, Git, Obsidian desktop, and external scripts to interact directly with the vault.
3. **Cryptographic User Isolation:** Each registered user's documents, conversations, and topics are strictly segmented via `user_id` foreign keys and authenticated session tokens.

---

## 2. SQLite Production Optimizations

To ensure high-throughput concurrent access in production, configure SQLite with:

```sql
-- 1. Enable Write-Ahead Logging (WAL) for concurrent reads during writes
PRAGMA journal_mode = WAL;

-- 2. Synchronous NORMAL provides durable integrity with minimal disk I/O bottleneck
PRAGMA synchronous = NORMAL;

-- 3. In-memory temporary tables for rapid query execution
PRAGMA temp_store = MEMORY;

-- 4. 64MB Cache size for active working set
PRAGMA cache_size = -64000;

-- 5. Foreign Key enforcement
PRAGMA foreign_keys = ON;
```

---

## 3. Reverse Proxy Configuration

### Caddy (Recommended for automatic HTTPS)
```caddy
nexusvault.example.com {
    encode gzip zstd

    # Server-Sent Events & Streaming responses (ChattyFi LLM replies)
    @sse {
        path /api/chattyfi/*
        header Accept text/event-stream
    }
    reverse_proxy @sse localhost:3001 {
        transport http {
            read_buffer 0
        }
    }

    # Standard API and Static Frontend
    reverse_proxy localhost:3001
}
```

### Nginx Alternative
```nginx
server {
    listen 443 ssl http2;
    server_name nexusvault.example.com;

    ssl_certificate /etc/letsencrypt/live/nexusvault.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nexusvault.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for live LLM Markdown streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

---

## 4. Docker Containerization

### Multi-Stage Dockerfile
```dockerfile
# Build Stage: Frontend Vite compilation
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Runtime Stage
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/raw ./raw
COPY --from=build /app/process ./process

EXPOSE 3001
VOLUME ["/app/server", "/app/raw", "/app/process"]
CMD ["node", "server/index.js"]
```

### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  nexus-vault:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
      - CHATTYFI_REQUIRE_AUTH=false
    volumes:
      - ./data/server:/app/server
      - ./data/raw:/app/raw
      - ./data/process:/app/process
```

---

## 5. Automated Backup & Disaster Recovery

SQLite provides non-blocking online backups while the application runs:

```bash
#!/bin/bash
# Hourly SQLite snapshot with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/nexus_vault"
mkdir -p "$BACKUP_DIR"

# 1. Vacuum snapshot of SQLite database
sqlite3 /app/server/vault.db ".backup $BACKUP_DIR/vault_$TIMESTAMP.db"

# 2. Archive Markdown folders
tar -czf "$BACKUP_DIR/markdown_$TIMESTAMP.tar.gz" -C /app raw process

# 3. Retain last 7 days of backups
find "$BACKUP_DIR" -type f -mtime +7 -delete
```

---

## 6. Security Hardening Checklist
- [x] Parameterized SQL Queries across all endpoints (zero string concatenation).
- [x] Strict Path Traversal Guards ensuring file operations are contained inside `raw/` and `process/`.
- [x] Salted `crypto.scrypt` password hashing with timing-safe comparison.
- [x] Strict Safeguard 5 blocking incomplete conversation turns from polluting knowledge capture.
- [x] React Markdown XSS sanitization rendering raw HTML safely.

