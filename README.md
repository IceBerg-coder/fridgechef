# FridgeChef

FridgeChef is a Next.js application that helps users generate recipe ideas based on ingredients they have available. The app leverages AI to create personalized recipe suggestions, improve existing recipes, and manage saved recipes.

## Features

- **Recipe Generation**: Create new recipes based on ingredients you have
- **Recipe Improvement**: Enhance existing recipes with AI suggestions
- **Recipe Management**: Save and organize your favorite recipes
- **User Authentication**: Create an account to save your preferences
- **User Profiles**: Customize your cooking preferences

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Prisma with SQLite
- **Authentication**: NextAuth.js
- **AI Integration**: Custom AI flows for recipe generation and enhancement
- **Testing**: Jest for component and integration testing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/ai`: AI integration and recipe generation flows
- `/src/app`: Next.js app router pages and API routes
- `/src/components`: Reusable UI components
- `/src/hooks`: Custom React hooks
- `/prisma`: Database schema and migrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
