# Micoz - Social Media Platform

Advanced social media platform with AI-powered content creation and comprehensive analytics.

## Project Structure

```
micoz/
├── frontend/          # React 18 + TypeScript frontend
├── backend/           # Node.js 18 + Express backend
├── package.json       # Monorepo configuration
└── README.md         # This file
```

## Tech Stack

### Frontend
- React 18 with TypeScript
- Styled Components for styling
- Redux Toolkit for state management
- React Router v6 for routing
- Framer Motion for animations

### Backend
- Node.js 18 with Express.js
- PostgreSQL with Prisma ORM
- JWT for authentication
- AWS S3 for file storage

## Development Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development servers:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run test` - Run tests for both applications
- `npm run lint` - Run linting for both applications
- `npm run format` - Format code with Prettier

## Environment Variables

See `.env.example` for required environment variables including database connection, JWT secrets, and AWS S3 configuration.