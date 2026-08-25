FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY InventoryApi/InventoryApi.csproj InventoryApi/
RUN dotnet restore InventoryApi/InventoryApi.csproj

COPY InventoryApi/ InventoryApi/

WORKDIR /src/InventoryApi
RUN dotnet publish InventoryApi.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "InventoryApi.dll"]