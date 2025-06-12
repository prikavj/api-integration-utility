FROM mcr.microsoft.com/dotnet/sdk:9.0-preview AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["ApiIntegration.Api/ApiIntegration.Api.csproj", "ApiIntegration.Api/"]
RUN dotnet restore "ApiIntegration.Api/ApiIntegration.Api.csproj"

# Copy the rest of the code
COPY . .

# Build the application
WORKDIR /src/ApiIntegration.Api
RUN dotnet build "ApiIntegration.Api.csproj" -c Release -o /app/build

# Create migrations if they don't exist
RUN dotnet tool install --global dotnet-ef
ENV PATH="${PATH}:/root/.dotnet/tools"
RUN dotnet ef migrations add AddApiEndpointsTable

# Publish the application
FROM build AS publish
RUN dotnet publish "ApiIntegration.Api.csproj" -c Release -o /app/publish

# Final image
FROM mcr.microsoft.com/dotnet/aspnet:9.0-preview AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create entrypoint script
RUN echo '#!/bin/bash\n\
echo "Installing dotnet-ef..."\n\
dotnet tool install --global dotnet-ef\n\
export PATH="$PATH:/root/.dotnet/tools"\n\
\n\
echo "Waiting for database to be ready..."\n\
sleep 10\n\
\n\
echo "Applying database migrations..."\n\
dotnet ef database update\n\
\n\
echo "Starting application..."\n\
dotnet ApiIntegration.Api.dll' > /app/entrypoint.sh && \
chmod +x /app/entrypoint.sh

ENV ASPNETCORE_ENVIRONMENT=Development
ENV ConnectionStrings__DefaultConnection="Host=db;Database=apiintegration;Username=admin;Password=your_secure_password_here"

ENTRYPOINT ["/app/entrypoint.sh"] 