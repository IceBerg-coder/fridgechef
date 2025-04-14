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
- **Database**: Prisma with SQLite
- **Authentication**: NextAuth.js
- **AI Integration**: Custom AI flows for recipe generation and enhancement
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

4. Initialize and seed the database:
   ```
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Run the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/ai`: AI integration and recipe generation flows
- `/src/app`: Next.js app router pages and API routes
- `/src/components`: Reusable UI components and layout elements
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utility functions and helpers
- `/prisma`: Database schema and migrations
- `/docs`: Project documentation and blueprints

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm test`: Run tests
- `npm run lint`: Lint the codebase

## API Routes

- `/api/recipes`: Recipe CRUD operations
- `/api/auth`: Authentication endpoints
- `/api/user`: User profile management
- `/api/collections`: Recipe collection management

## Deployment

The application can be deployed to Vercel with minimal configuration:

```bash
npm install -g vercel
vercel
```

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
