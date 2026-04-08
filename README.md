# Switchboard Notes Application

A full-stack note-taking application with a React frontend, Node.js backend, and PostgreSQL persistence, deployed through containers with reverse-proxy routing.

## 1. Architecture

This project uses a container-first, service-separated architecture:

- Frontend: React 18 application
- Backend: Node.js and Express REST API with JWT validation
- App Database: PostgreSQL for notes data
- Reverse Proxy: Traefik for host-based routing and TLS
- Auth Provider: External OIDC/JWT issuer (for example, Clerk)

## 2. Features

- JWT-protected Notes API
- CRUD operations for notes
- PostgreSQL data storage
- Reverse-proxy routing with HTTPS support
- Security headers and CORS configuration
- Containerized local and VM deployment support

## 3. Prerequisites

- Docker and Docker Compose
- Node.js 18+ (only needed for local non-container workflows)
- Git

## 4. Quick Start

### 4.1 Start Services

```bash
git clone <repository-url>
cd switchboard
docker-compose up -d --build
```

### 4.2 Verify Services

```bash
docker-compose ps
docker-compose logs -f backend
```

Default local endpoints:

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/api/health

## 5. Environment Configuration

Environment files in this repository:

1. .env
2. .env.example
3. .env.prod
4. backend/.env.example
5. frontend/.env.example

Minimum values to review before deployment:

1. VITE_API_URL
2. VITE_CLERK_PUBLISHABLE_KEY
2. APP_CORS_ORIGINS
3. ACME_EMAIL (for TLS)
4. Issuer and client settings expected by backend JWT validation

## 6. Available Operations

Primary workflow uses Docker Compose directly:

```bash
docker-compose up -d --build
docker-compose down
docker-compose logs -f
```

Security and verification scripts are available in scripts/.

## 7. Documentation

- doc/QUICKSTART.md
- doc/AUTOMATED_SETUP.md
- .github/copilot-instructions.md

## 8. API Endpoints

All notes endpoints require a valid bearer token.

Authorization header format:

```bash
Authorization: Bearer <token>
```

### 8.1 GET /api/notes

Fetch all notes for the authenticated user.

### 8.2 POST /api/notes

Create a note.

Request body:

```json
{
	"title": "My Note",
	"content": "Note content"
}
```

### 8.3 PUT /api/notes/:id

Update an existing note.

### 8.4 DELETE /api/notes/:id

Delete a note.

## 9. Security Highlights

- HTTPS-ready deployment path
- CORS allowlist support
- Helmet security headers
- Input validation and parameterized SQL
- JWT signature and expiry checks on protected endpoints

## 10. Troubleshooting

### 10.1 Backend Cannot Connect to Database

```bash
docker-compose ps
docker-compose logs app-db
```

### 10.2 Frontend Cannot Reach Backend

Check:

1. backend service is healthy
2. VITE_API_URL is correct
3. APP_CORS_ORIGINS includes frontend origin

### 10.3 Authentication Token Errors

Verify:

1. Token issuer and audience/client values match backend expectations
2. Token is not expired
3. OIDC_JWKS_URI and OIDC_ISSUER_URLS are reachable from backend container

## 11. Production Deployment

### 11.1 VM and DNS Routing

The reverse proxy supports host-based routing with TLS certificates.

Example host mapping:

- app.example.com -> frontend
- api.example.com -> backend

Deployment outline:

1. Configure DNS A records to VM IP
2. Populate production .env values
3. Run docker-compose up -d --build
4. Validate public endpoints

### 11.2 CI/CD Deployment to VM

Deployment workflow is defined in .github/workflows/deploy-vm.yml.

Required secrets typically include:

1. VM_HOST
2. VM_USER
3. VM_SSH_KEY
4. VM_PORT
5. VM_APP_DIR

## 12. Repository Structure

```text
switchboard/
├── backend/
├── doc/
├── frontend/
├── reverse-proxy/
├── scripts/
├── docker-compose.yml
└── docker-compose.prod.yml
```
