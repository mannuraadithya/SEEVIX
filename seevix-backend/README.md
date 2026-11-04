# SEEVIX Backend

Spring Boot REST API starter for the SEEVIX civic intelligence platform.

## Requirements
- JDK 25
- Apache Maven 3.9+ (Maven 3.10.0 is fine)
- PostgreSQL

## 1. Create the database
Create a PostgreSQL database named `seevix_db`:
```sql
CREATE DATABASE seevix_db;
```

## 2. Configure credentials
The default username is `postgres`; the placeholder password is `change_me`.
Change it in `src/main/resources/application.properties`, or set environment variables:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Do not commit real database passwords to Git.

## 3. Run
Open a terminal in this folder:
```powershell
mvn spring-boot:run
```
The server uses `http://localhost:8080`.

## 4. Test
Open `http://localhost:8080/api/health`.
Expected JSON:
```json
{"application":"SEEVIX Backend","status":"UP","message":"SEEVIX API is running"}
```

## Current scope
This starter includes the Spring Boot application and a health endpoint. Complaint APIs, authentication, PostGIS, and AI integration will be added in later stages.
