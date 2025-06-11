# API Integration Utility

A modern full-stack application featuring a React TypeScript frontend, ASP.NET Core 9 backend, and PostgreSQL database. The application provides user authentication and a professional dashboard interface for API integration management.

## Features

### Authentication
- User registration with password confirmation
- Secure login system
- Session management
- Professional authentication UI with validation
- Error handling and loading states

### Dashboard
- Modern interface with sidebar navigation
- Real-time statistics display
- Recent activity monitoring
- Quick access to key features
- Professional dark theme with accent colors

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Axios for API communication
- Modern UI with custom styling
- Responsive design for all devices

### Backend
- ASP.NET Core 9 (Preview)
- Entity Framework Core for database operations
- PostgreSQL database
- RESTful API architecture
- Secure password hashing

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
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - Swagger UI: http://localhost:5001/swagger
   - Database: localhost:5433

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

### Database
- PostgreSQL database running on port 5433
- Automatic migrations on startup
- Entity Framework Core for data access

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login

### Dashboard (Protected Routes)
- GET `/api/dashboard/stats` - Dashboard statistics
- GET `/api/dashboard/activity` - Recent activity

## Environment Variables

### Frontend
- `REACT_APP_API_URL` - Backend API URL

### Backend
- `ConnectionStrings__DefaultConnection` - PostgreSQL connection string
- `ASPNETCORE_ENVIRONMENT` - Development/Production

## Container Architecture

The application runs in three containers:
1. **Frontend Container**: React application
   - Port: 3000
   - Built with Node.js
   - Production-ready build served statically

2. **Backend Container**: ASP.NET Core API
   - Port: 5001
   - .NET 9 runtime
   - Direct database access

3. **Database Container**: PostgreSQL
   - Port: 5433
   - Persistent volume for data storage
   - Automatic initialization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 