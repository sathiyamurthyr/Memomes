# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /app

COPY src/Memomes.Api/Memomes.Api.csproj ./src/Memomes.Api/
RUN dotnet restore ./src/Memomes.Api/Memomes.Api.csproj

COPY src/Memomes.Api/ ./src/Memomes.Api/
WORKDIR /app/src/Memomes.Api
RUN dotnet publish -c Release -o /app/out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Memomes.Api.dll"]
