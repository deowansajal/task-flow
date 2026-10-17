# Keep task operations inside the Next.js application

TaskFlow has one interface and a small personal task domain. Reads and writes stay inside the single Next.js application: a small task module uses Prisma to access PostgreSQL, and Zod validates every write on the server before database access. A separate public API and a generic repository layer are outside the first version because they would add contracts and indirection without another consumer or persistence implementation to support.
