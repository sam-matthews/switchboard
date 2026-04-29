# GitHub Copilot Instructions

## Project Overview
This is a React frontend and Node.js backend application with authentication support, using PostgreSQL for data persistence.

## Architecture & Infrastructure

### Container Requirements
- **Always use containers** for all services and dependencies
- Use **PostgreSQL database in a separate container** - never use SQLite or in-memory databases
- Define services in `docker-compose.yml` with proper networking and volume management
- Each service (frontend, backend, database) should run in its own container
- Use multi-stage builds in Dockerfiles to minimize image size
- Pin specific image versions (avoid `latest` tag) for reproducibility

### Reverse Proxy Requirements
- Use a dedicated reverse proxy service (for example, Nginx or Traefik) in its own container
- Keep reverse proxy configuration files in a top-level `reverse-proxy/` directory
- Split configuration by concern: a main config file plus per-service or per-host includes
- Mount configuration files as read-only volumes into the reverse proxy container
- Use environment variables for hostnames and upstream targets where supported
- Include health checks and sane timeouts in the proxy configuration

### Best Practice Architecture Standards
- **Separation of Concerns**: Keep frontend, backend, authentication, and database layers separate
- **Microservices Pattern**: Each service should be independently deployable
- **API Gateway Pattern**: Backend acts as gateway between frontend and services
- **Environment-based Configuration**: Use environment variables for all configuration
- **Health Checks**: Implement health check endpoints for all services
- **Graceful Shutdown**: Handle SIGTERM signals properly in all services

## Code Quality & Standards

### General Coding Practices
- **DRY Principle**: Don't repeat yourself - extract reusable functions and components
- **SOLID Principles**: Follow single responsibility, open/closed, and dependency injection principles
- **Error Handling**: Always implement proper error handling with meaningful error messages
- **Logging**: Use structured logging with appropriate log levels (error, warn, info, debug)
- **Security First**: Never commit secrets, use environment variables, validate all inputs
- **Type Safety**: Use JSDoc comments or TypeScript for better type checking
- **Async/Await**: Prefer async/await over callbacks or raw promises for readability

### Backend (Node.js/Express)
- Use middleware for cross-cutting concerns (auth, logging, error handling)
- Implement request validation using libraries like `joi` or `express-validator`
- Use connection pooling for database connections
- Implement proper HTTP status codes (200, 201, 400, 401, 403, 404, 500, etc.)
- Use route-based organization in `src/routes/`
- Keep business logic separate from route handlers
- Use async error handling middleware

### Frontend (React)
- Use functional components with hooks
- Implement proper component composition and reusability
- Keep components focused and single-purpose
- Use Context API or state management for global state
- Implement proper loading and error states
- Use semantic HTML and accessibility best practices
- Lazy load routes and heavy components

### Database (PostgreSQL)
- Use parameterized queries to prevent SQL injection
- Implement database migrations for schema changes
- Use indexes appropriately for query performance
- Follow PostgreSQL naming conventions (snake_case for tables/columns)
- Create database constraints (foreign keys, unique, not null) at the database level
- Use transactions for multi-step operations

### Authentication & Security
- Validate JWT tokens on every protected endpoint
- Implement proper CORS configuration
- Use HTTPS in production
- Sanitize user inputs to prevent XSS attacks
- Implement rate limiting to prevent abuse
- Use secure session management

## Development Workflow

### Code Organization
- Keep configuration files in the root directory
- Keep documentation files in a `doc/` folder, organized by component in subdirectories:
  - `doc/workflows/` for GitHub Actions and CI/CD documentation
  - `doc/backend/` for backend-specific documentation
  - `doc/frontend/` for frontend-specific documentation
  - `doc/infrastructure/` for Docker, reverse proxy, and deployment documentation
  - `doc/security/` for security policies and procedures
  - Exception: `README.md` stays at the root for project overview
- Organize backend code in `backend/src/` with subdirectories for routes, middleware, models, services
- Organize frontend code in `frontend/src/` with subdirectories for components, contexts, services, utils
- Use meaningful file and directory names
- One component per file in frontend

### Testing
- Write unit tests for business logic
- Write integration tests for API endpoints
- Test error scenarios, not just happy paths
- Mock external dependencies in tests
- Aim for meaningful test coverage, not just high percentages

### Documentation
- Add JSDoc comments to all exported functions
- Keep README.md up-to-date with setup and running instructions
- Document API endpoints with request/response examples
- Comment complex business logic
- Use clear, descriptive variable and function names
- Ensure all Markdown files adhere to linting standards
