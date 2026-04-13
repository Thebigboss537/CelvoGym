FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG NUGET_TOKEN
WORKDIR /src
COPY Directory.Build.props ./
COPY Kondix.slnx ./
COPY nuget.config ./
COPY src/Kondix.Domain/Kondix.Domain.csproj src/Kondix.Domain/
COPY src/Kondix.Application/Kondix.Application.csproj src/Kondix.Application/
COPY src/Kondix.Infrastructure/Kondix.Infrastructure.csproj src/Kondix.Infrastructure/
COPY src/Kondix.Api/Kondix.Api.csproj src/Kondix.Api/
RUN GITHUB_TOKEN=$NUGET_TOKEN dotnet restore src/Kondix.Api/Kondix.Api.csproj
COPY src/ src/
RUN dotnet publish src/Kondix.Api/Kondix.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*
USER $APP_UID
COPY --from=build /app .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/v1/health || exit 1
ENTRYPOINT ["dotnet", "Kondix.Api.dll"]
