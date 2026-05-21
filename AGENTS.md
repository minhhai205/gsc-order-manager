# AGENTS.md

## Project Scope

This repository is `gsc-order-manager`, a monolithic order management system with:

- `backend/`: Spring Boot application.
- `frontend/`: React application.

When working in this repository, keep changes scoped to the requested feature or fix. Do not rewrite project structure unless the user explicitly asks for a refactor.

## Backend Guidelines

The backend uses Spring Boot in a monolithic layered architecture.

Expected stack:

- Spring Boot
- Spring Security with JWT authentication
- Spring Data JPA
- Relational database through JPA entities
- Maven

Use this package style under `backend/src/main/java/com/httt/gsc_order_manager`:

- `controller`: REST controllers only. Keep request handling thin.
- `service`: business logic and transaction orchestration.
- `service.impl`: service implementations when interfaces are used.
- `repository`: Spring Data JPA repositories.
- `entity`: JPA entities and domain enums.
- `dto`: request and response DTOs.
- `mapper`: DTO/entity mapping helpers.
- `security`: JWT filters, security config, user details, auth helpers.
- `config`: application configuration.
- `exception`: custom exceptions and global exception handling.

Backend rules:

- Controllers should not access repositories directly.
- Services own business rules, validation that requires persistence, and transaction boundaries.
- Repositories should stay as Spring Data interfaces unless a custom query is necessary.
- Use DTOs for API input and output. Do not expose JPA entities directly from controllers.
- Use `@Transactional` on service methods that modify state.
- Use clear entity relationships with JPA annotations instead of manual foreign key fields where object navigation is useful.
- Keep JWT/security code isolated in `security`.
- Prefer constructor injection.
- Use enums for fixed statuses and roles.
- Avoid putting business logic in entities unless it is small and domain-specific.

Suggested backend module flow:

```text
Controller -> Service -> Repository -> Entity
DTO <-> Mapper <-> Entity
Security -> JWT -> Auth context
```

## Frontend Guidelines

The frontend uses React.

Expected stack:

- React
- Vite if already configured
- JavaScript or JSX following the existing project style
- API calls to the Spring Boot backend

Use this structure under `frontend/src` when adding features:

- `components`: reusable UI components.
- `pages`: route-level screens.
- `services`: API clients and backend calls.
- `hooks`: reusable React hooks.
- `contexts`: React context providers such as auth state.
- `utils`: small pure helpers.
- `assets`: static assets used by the app.

Frontend rules:

- Keep API access in `services`, not directly spread across components.
- Keep route-level data loading and page state in `pages` or hooks.
- Keep reusable visual pieces in `components`.
- Store JWT/auth state through a dedicated auth service/context.
- Match the existing styling approach before introducing a new UI library.
- Do not build landing pages for app features unless explicitly requested; build the usable workflow screen.

## Database And Domain

The system domain is based on GSC order processing:

- Federal agencies
- Standing contracts
- Equipment catalog and inventory
- Purchase orders and line items
- PO validation
- Rejection letters
- Exception reports
- Shipping bills
- Audit logs

When creating backend tables, prefer JPA entities and migrations if the project has migration tooling. If no migration tooling exists yet, configure JPA schema generation only for development and discuss migration setup before production-style changes.

## Commands

Run backend commands from `backend/`:

```bash
./mvnw test
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Run frontend commands from `frontend/`:

```bash
npm install
npm run dev
npm run build
```

## Verification

Before finishing backend changes:

- Run Maven tests when feasible.
- Confirm the Spring context starts for dependency, entity, and security changes.

Before finishing frontend changes:

- Run the frontend build when feasible.
- For UI work, start the dev server and verify the page in the browser when practical.

If a command cannot be run, state the reason clearly in the final response.

