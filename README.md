# API Integration Utility

A modern full-stack application featuring a React TypeScript frontend, ASP.NET Core 9 backend, and PostgreSQL database. The application provides user authentication and a professional dashboard interface for API integration management.

## Features

### Core Features
- Person and Product management with one-to-many relationship
- RESTful API endpoints with proper documentation
- Swagger UI integration
- PostgreSQL database with Entity Framework Core
- Docker containerization

### Data Models

#### Person
- Unique identifier (GUID)
- Name (required, max 100 characters)
- Email (required, max 255 characters)
- Creation timestamp
- Collection of associated products

#### Product
- Unique identifier (GUID)
- Name (required, max 200 characters)
- Price (decimal 18,2)
- Creation timestamp
- Reference to owner (PersonId)

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
- Swagger UI for API documentation

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

## API Endpoints

### Person API

#### GET /api/Person
- Returns a list of all people (without their products)
- Response: Array of person objects with basic information

#### GET /api/Person/{id}
- Returns a specific person by ID, including their products
- Response: Person object with nested products array

#### POST /api/Person
- Creates a new person
- Request body: { name: string, email: string }
- Response: Created person object

#### PUT /api/Person/{id}
- Updates an existing person
- Request body: { name: string, email: string }
- Response: 204 No Content

#### DELETE /api/Person/{id}
- Deletes a person and their associated products
- Response: 204 No Content

### Product API

#### GET /api/Product
- Returns a list of all products
- Response: Array of product objects with personId

#### GET /api/Product/{id}
- Returns a specific product by ID
- Response: Product object

#### POST /api/Product
- Creates a new product
- Request body: { name: string, price: decimal, personId: guid }
- Response: Created product object

#### PUT /api/Product/{id}
- Updates an existing product
- Request body: { name: string, price: decimal }
- Response: 204 No Content

#### DELETE /api/Product/{id}
- Deletes a product
- Response: 204 No Content

## Database Schema

### People Table
```sql
CREATE TABLE "People" (
    "Id" uuid PRIMARY KEY,
    "Name" varchar(100) NOT NULL,
    "Email" varchar(255) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE "Products" (
    "Id" uuid PRIMARY KEY,
    "Name" varchar(200) NOT NULL,
    "Price" decimal(18,2) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "PersonId" uuid NOT NULL,
    FOREIGN KEY ("PersonId") REFERENCES "People" ("Id") ON DELETE CASCADE
);
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
│   │   ├── DTOs/          # Data transfer objects
│   │   └── ...
│   └── Dockerfile
└── docker-compose.yml      # Container orchestration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 