# Reusable Prompt: Generate Architecture Doc with Mermaid Diagrams

Copy-paste the prompt below into Kombai to create architecture docs with mermaid diagrams. To see the mermaid diagrams, you need to have "Markdown Preview Mermaid Support" VS Code plugin installed and open the .md file in VS Code's builtin Markdown preview (right click on the .md file -> Open Preview).

---

## Prompt

```
Analyze this entire repository and create an ARCHITECTURE.md file with Mermaid diagrams documenting the full application architecture.

Explore all source files, configs, and dependencies to understand the complete system. Then produce the following sections (skip any section that doesn't apply to this project):

1. **High-Level System Overview** — `graph TD` showing the client app, backend services, databases, third-party integrations, and external APIs with labeled connections between them. If monorepo, show each package/app as a subgraph.

2. **Application Layer Architecture** — ASCII art diagram showing the architectural layers (e.g., Presentation → State → Data Access, or Controllers → Services → Repositories, etc.) with the specific files/modules in each layer. Use ASCII here since Mermaid doesn't handle nested containers well.

3. **Authentication & Authorization Flow** (if applicable) — `flowchart TD` showing every step from unauthenticated user → auth method → session/token management → middleware/guards → authenticated access. Include all auth methods found in the code (OAuth, email/password, SSO, API keys, JWT, etc.).

4. **Core Data Flow** — `flowchart LR` showing how the primary feature's data moves through the system end-to-end. For frontend apps: UI → state management → API layer → backend. For backend apps: request → middleware → controller → service → database. Include realtime/websocket/event-driven flows if present.

5. **State Management & Context Hierarchy** (if applicable) — `graph TD` showing how global state is organized. For React: provider/context nesting from root down. For Vue: Pinia stores and composables. For Angular: services and NgRx stores. For backend: dependency injection or module hierarchy. Color-code each node by purpose.

6. **Database Schema** (if applicable) — `erDiagram` with all tables/collections, their columns/fields with types, and relationships. Mark PKs, FKs, and nullable fields. For NoSQL, show document structures and references.

7. **API Endpoints** (if applicable) — Markdown table with columns: Method, Path, Description, Auth Required. Group by resource/domain. For GraphQL, list queries and mutations instead.

8. **Page/Route Map** (if applicable) — `flowchart LR` showing all routes, grouped into logical sections (e.g., public vs protected, or by feature module). Show redirects, guards, and middleware.

9. **Key Technology Stack** — Markdown table with columns: Layer, Technology, Purpose. Read the dependency manifest (package.json, requirements.txt, Gemfile, pubspec.yaml, etc.) to list actual packages and versions used.

10. **Project Structure** — Annotated directory tree (code block) of the source folder with a short comment explaining each directory's purpose.

Rules:
- Use ```mermaid fenced code blocks for all Mermaid diagrams
- Add `style` directives to color-code important nodes (e.g., green for success/data, amber for middleware/guards, purple for state stores, blue for external services)
- Use subgraphs to group related nodes
- Keep node labels concise but descriptive (use <br/> for multi-line labels in Mermaid)
- Be exhaustive — include ALL routes, stores, providers, tables, and endpoints found in the codebase
- Skip sections that don't apply (e.g., no auth section for a static site, no DB schema for a pure frontend app)
- Adapt terminology to the framework (e.g., "hooks/providers" for React, "composables/stores" for Vue, "services/modules" for Angular, "widgets/blocs" for Flutter, "controllers/middleware" for backend frameworks)
```
