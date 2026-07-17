# Use the official .NET 10.0 runtime as a parent image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80

# Use the SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["MairePoodBackend.csproj", "./"]
RUN dotnet restore "MairePoodBackend.csproj"
COPY . .
RUN dotnet build "MairePoodBackend.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "MairePoodBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the runtime image to run the application
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MairePoodBackend.dll"]
