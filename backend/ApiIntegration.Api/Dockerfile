FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ApiIntegration.Api.csproj", "./"]
RUN dotnet restore "ApiIntegration.Api.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "ApiIntegration.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ApiIntegration.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Create Data directory and copy mapping files
RUN mkdir -p /app/Data
COPY --from=build /src/Data/api_endpoint_mapping.json /app/Data/
COPY --from=build /src/Data/chain_mapping.json /app/Data/
# Verify files are copied
RUN ls -la /app/Data/
ENTRYPOINT ["dotnet", "ApiIntegration.Api.dll"] 