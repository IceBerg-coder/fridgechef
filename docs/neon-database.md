# Neon Database Integration Guide

This document explains how to use the Neon Database integration in the FridgeChef application.

## Overview

The FridgeChef application supports multiple database backends:
- SQLite for local development (default)
- PostgreSQL for production via Vercel Postgres
- Neon Database as a PostgreSQL serverless option

The application will automatically detect which database to use based on the environment variables.

## Environment Variables

To use Neon Database, you need to set the following environment variable:

```
NEON_DATABASE_URL="postgres://user:password@endpoint.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

You can obtain this connection string from the Neon Dashboard after creating a project.

## Local Development

For local development:

1. Create a Neon account at https://neon.tech/
2. Create a new project in Neon Dashboard
3. Get the connection string from the dashboard
4. Add the connection string to your `.env` file as `NEON_DATABASE_URL`
5. Run the database setup script: `npm run setup-neon-db`

## Production Deployment

For deployment to Vercel:

1. Add the `NEON_DATABASE_URL` environment variable in your Vercel project settings
2. Deploy your application

## Database Setup

The application includes a setup script that creates all the necessary tables in your Neon Database:

```bash
npm run setup-neon-db
```

This script will:
1. Test the connection to your Neon Database
2. Create tables based on your schema
3. Create necessary indexes for performance

## Using Neon Database in Your Code

You can use the Neon Database utilities in your code like this:

```typescript
import { fetchNeonData, getRecipes, getUserById } from '@/lib/neon-db';

// Fetch all recipes
const recipes = await getRecipes();

// Fetch a user by ID
const user = await getUserById('some-user-id');

// Run a custom query
const result = await fetchNeonData('SELECT * FROM "Recipe" WHERE name LIKE $1', [`%${searchQuery}%`]);
```

## Performance Considerations

Neon Database is a serverless PostgreSQL service which means:

1. First-time connections may have some cold-start latency
2. Inactive connections will be closed automatically
3. The library handles connection pooling automatically

The application is configured to reuse database connections when possible to minimize latency.

## Switching Between Database Backends

The application determines which database to use based on environment variables:

1. If `NEON_DATABASE_URL` is defined, it will use Neon Database
2. If `POSTGRES_PRISMA_URL` or related variables are defined, it will use Vercel Postgres
3. Otherwise, it falls back to SQLite using `DATABASE_URL`

No code changes are required to switch between backends as long as the appropriate environment variables are set.