# API Integration Utility

A modern full-stack application featuring a React TypeScript frontend, ASP.NET Core 9 backend, and PostgreSQL database. The application provides user authentication and a professional dashboard interface for API integration management.

## Features

### Core Features
- Secure JWT-based authentication
- User profile management
- Modern dashboard interface
- Swagger UI integration with authentication support
- PostgreSQL database with Entity Framework Core
- Docker containerization

### Authentication & Authorization
- JWT (JSON Web Token) based authentication
- Secure password hashing using SHA256
- Token-based API access
- Protected routes and endpoints

### User Interface
- Clean and modern dashboard
- Profile information display
- API integration section (coming soon)
- Swagger documentation access
- Professional dark theme with accent colors

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Axios for API communication with JWT support
- Modern UI with custom styling
- Responsive design for all devices

### Backend
- ASP.NET Core 9 (Preview)
- Entity Framework Core for database operations
- JWT authentication middleware
- PostgreSQL database
- Swagger UI with Bearer token authentication

### Infrastructure
- Docker containerization
- Docker Compose for orchestration
- PostgreSQL for data persistence

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- .NET 9 SDK (for local development)

### Quick Start
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd api-integration-utility
   ```

2. Start the application:
   ```bash
   docker compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - Swagger UI: http://localhost:5001/swagger
   - Database: localhost:5433

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Creates a new user account.
```json
{
  "username": "string",
  "password": "string"
}
```
Response: 200 OK
```json
{
  "message": "Registration successful"
}
```

#### POST /api/auth/login
Authenticates a user and returns a JWT token.
```json
{
  "username": "string",
  "password": "string"
}
```
Response: 200 OK
```json
{
  "token": "JWT_TOKEN_STRING",
  "message": "Login successful"
}
```

#### GET /api/auth/profile
Returns the authenticated user's profile information.

**Authentication Required**: Bearer Token

Response: 200 OK
```json
{
  "id": 0,
  "username": "string",
  "createdAt": "datetime"
}
```

### Using Authentication in Swagger UI

1. Click the "Authorize" button (🔓) at the top of the Swagger UI
2. Enter your JWT token (without "Bearer" prefix)
3. Click "Authorize" and close the popup
4. Protected endpoints will now include your token automatically

### Using Authentication in Frontend

The frontend automatically handles authentication by:
1. Storing the JWT token in sessionStorage upon login
2. Including the token in all subsequent API requests
3. Redirecting to login when the token is invalid or missing
4. Clearing the token on logout

## Development

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Backend Development
```bash
cd backend/ApiIntegration.Api
dotnet run
```

### Docker Commands
```bash
# Build and start all containers
docker compose up --build

# Stop and remove containers
docker compose down

# View logs
docker compose logs -f
```

## Project Structure

```
api-integration-utility/
├── frontend/                # React TypeScript frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── ...
│   ├── Dockerfile
│   └── package.json
├── backend/                 # ASP.NET Core API
│   ├── ApiIntegration.Api/
│   │   ├── Controllers/    # API endpoints
│   │   ├── Data/          # Database context
│   │   ├── Models/        # Domain models
│   │   └── ...
│   └── Dockerfile
└── docker-compose.yml      # Container orchestration
```

## Security Considerations

- Passwords are hashed using SHA256
- JWT tokens expire after 24 hours
- CORS is configured for frontend origin only
- Authentication is required for sensitive endpoints
- Database credentials are managed via environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 