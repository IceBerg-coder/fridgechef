# FridgeChef

FridgeChef is a Next.js application that helps users generate recipe ideas based on ingredients they have available. The app leverages AI to create personalized recipe suggestions, improve existing recipes, and manage saved recipes.

## Features

- **Recipe Generation**: Create new recipes based on ingredients you have
- **Recipe Improvement**: Enhance existing recipes with AI suggestions
- **Recipe Management**: Save and organize your favorite recipes
- **Collections**: Group recipes into custom collections
- **User Authentication**: Create an account to save your preferences
- **User Profiles**: Customize your cooking preferences and dietary restrictions
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **UI Components**: Shadcn/UI component library
- **Backend**: Next.js API routes with server components
- **Database**: Supports both Prisma with PostgreSQL and direct Neon Database connection
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI and Anthropic for recipe generation and enhancement
- **Testing**: Jest for component and integration testing

## Getting Started

1. Clone the repository
   ```
   git clone https://github.com/IceBerg-coder/fridgechef.git
   cd fridgechef
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables:
   ```
   cp .env.example .env.local
   ```
   Edit `.env.local` to add your API keys and database configuration

4. Database setup (choose one option):

   **Option 1: Using Prisma with PostgreSQL**
   ```
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

   **Option 2: Using Neon Database directly**
   ```
   npm run setup:neon
   ```

5. Run the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

### Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth session encryption
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
- `OPENAI_API_KEY`: OpenAI API key for recipe generation

### Optional Environment Variables

- `ANTHROPIC_API_KEY`: Alternative AI provider for recipe generation
- `USE_NEON_DATABASE`: Set to "true" to use Neon Database directly instead of Prisma
- `POSTGRES_URL`: Pooled connection URL for Vercel Postgres (if using Vercel deployment)
- `POSTGRES_URL_NON_POOLING`: Direct connection URL for migrations

## Project Structure

- `/src/ai`: AI integration and recipe generation flows
- `/src/app`: Next.js app router pages and API routes
- `/src/components`: Reusable UI components and layout elements
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utility functions and helpers
- `/prisma`: Database schema and migrations
- `/docs`: Project documentation and blueprints
- `/scripts`: Utility scripts for database setup and testing

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm test`: Run tests
- `npm run lint`: Lint the codebase
- `npm run setup:neon`: Set up Neon Database schema
- `npm run verify:api-key`: Verify AI API key configuration

## API Routes

- `/api/recipes`: Recipe CRUD operations
- `/api/auth`: Authentication endpoints
- `/api/user`: User profile and preferences management
- `/api/collections`: Recipe collection management

## Deployment to Vercel

The application can be deployed to Vercel with the following steps:

1. Push your repository to GitHub
2. Import the repository in Vercel
3. Configure the required environment variables in Vercel project settings
4. Deploy the application

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped make FridgeChef better
- Shadcn/UI for the beautiful component library
- Next.js team for the amazing framework
- Neon Database for serverless Postgres
