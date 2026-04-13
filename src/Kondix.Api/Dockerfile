FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG NUGET_TOKEN
WORKDIR /src
COPY Directory.Build.props ./
COPY CelvoGym.slnx ./
COPY nuget.config ./
COPY src/CelvoGym.Domain/CelvoGym.Domain.csproj src/CelvoGym.Domain/
COPY src/CelvoGym.Application/CelvoGym.Application.csproj src/CelvoGym.Application/
COPY src/CelvoGym.Infrastructure/CelvoGym.Infrastructure.csproj src/CelvoGym.Infrastructure/
COPY src/CelvoGym.Api/CelvoGym.Api.csproj src/CelvoGym.Api/
RUN GITHUB_TOKEN=$NUGET_TOKEN dotnet restore src/CelvoGym.Api/CelvoGym.Api.csproj
COPY src/ src/
RUN dotnet publish src/CelvoGym.Api/CelvoGym.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*
USER $APP_UID
COPY --from=build /app .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/v1/health || exit 1
ENTRYPOINT ["dotnet", "CelvoGym.Api.dll"]
