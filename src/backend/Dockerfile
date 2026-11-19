# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files for caching layer
COPY ["Masar.sln", "./"]
COPY ["src/Masar.Api/Masar.Api.csproj", "src/Masar.Api/"]
COPY ["src/Masar.Application/Masar.Application.csproj", "src/Masar.Application/"]
COPY ["src/Masar.Domain/Masar.Domain.csproj", "src/Masar.Domain/"]
COPY ["src/Masar.Infrastructure/Masar.Infrastructure.csproj", "src/Masar.Infrastructure/"]
COPY ["tests/Masar.Application.Tests/Masar.Application.Tests.csproj", "tests/Masar.Application.Tests/"]
COPY ["tests/Masar.Domain.Tests/Masar.Domain.Tests.csproj", "tests/Masar.Domain.Tests/"]

RUN dotnet restore "Masar.sln"

# Copy remaining source code and publish
COPY . .
WORKDIR "/src/src/Masar.Api"
RUN dotnet publish "Masar.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

COPY --from=build /app/publish .

# Run as non-root user (built into Microsoft .NET images)
USER $APP_UID

ENTRYPOINT ["dotnet", "Masar.Api.dll"]
