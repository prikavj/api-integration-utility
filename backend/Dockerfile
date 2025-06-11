FROM mcr.microsoft.com/dotnet/sdk:9.0-preview AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["ApiIntegration.Api/ApiIntegration.Api.csproj", "ApiIntegration.Api/"]
RUN dotnet restore "ApiIntegration.Api/ApiIntegration.Api.csproj"

# Copy the rest of the code
COPY . .

# Build the application
WORKDIR "/src/ApiIntegration.Api"
RUN dotnet build "ApiIntegration.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ApiIntegration.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0-preview AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENV ASPNETCORE_URLS=http://+:80

ENTRYPOINT ["dotnet", "ApiIntegration.Api.dll"] 