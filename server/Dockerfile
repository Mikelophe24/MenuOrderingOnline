FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src
COPY ["OnlineMenu.API/OnlineMenu.API.csproj", "OnlineMenu.API/"]
COPY ["OnlineMenu.Application/OnlineMenu.Application.csproj", "OnlineMenu.Application/"]
COPY ["OnlineMenu.Core/OnlineMenu.Core.csproj", "OnlineMenu.Core/"]
COPY ["OnlineMenu.Infrastructure/OnlineMenu.Infrastructure.csproj", "OnlineMenu.Infrastructure/"]
RUN dotnet restore "OnlineMenu.API/OnlineMenu.API.csproj"
COPY . .
RUN dotnet publish "OnlineMenu.API/OnlineMenu.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "OnlineMenu.API.dll"]
