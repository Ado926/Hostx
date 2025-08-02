# Overview

This is a comprehensive full-stack web terminal emulator application built with React frontend and Express backend. The application simulates a complete Unix-like terminal environment in the browser with extensive command support, integrated file manager, and real-time system monitoring. It features WebSocket communication, persistent file system simulation, multiple programming language support, and network tools like curl and git clone functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for development and building
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: React hooks for local state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket connection for terminal command execution

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **WebSocket Server**: Built-in WebSocket server for real-time terminal communication
- **Command Processing**: Custom terminal processor that simulates Unix-like commands
- **Session Management**: Terminal sessions with command history and current directory tracking

## Data Storage Solutions
- **Database**: Drizzle ORM configured for PostgreSQL with Neon serverless driver
- **Schema Design**: 
  - Users table for authentication
  - Terminal sessions for persistent session state
  - File system table for simulating directory/file structure
- **In-Memory Storage**: Fallback memory storage implementation for development
- **File System Simulation**: Virtual file system with basic Unix-like directory structure

## Authentication and Authorization
- **Session Management**: PostgreSQL session storage with connect-pg-simple
- **User System**: Basic user authentication structure prepared but not fully implemented
- **Session Persistence**: Terminal sessions linked to users for state persistence

## Real-time Features
- **WebSocket Communication**: Bidirectional communication for command execution
- **Command Processing**: Real-time command parsing and execution simulation
- **Terminal State**: Live updates of current directory, command history, and output
- **Connection Management**: Automatic reconnection and connection state handling
- **Multi-tab Interface**: Terminal, File Manager, System Monitor, and Settings tabs
- **Resource Monitoring**: Real-time CPU, memory, and disk usage tracking

## Deployment Configuration
- **Platform Compatibility**: 100% compatible with Vercel and Render deployment platforms
- **Production Build**: Optimized build process with esbuild and Vite
- **Health Monitoring**: Built-in health check endpoints for deployment platforms
- **Environment Configuration**: Proper environment variable handling for production
- **Static File Serving**: Optimized static file serving for production environments

## Development and Build System
- **Build Tool**: Vite for frontend development and building
- **TypeScript**: Full TypeScript support across frontend and backend
- **Development Mode**: Hot module replacement and development server integration
- **Production Build**: Separate client and server builds with static file serving

# External Dependencies

## Database and Storage
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI and Styling
- **Radix UI**: Headless UI component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for UI components
- **class-variance-authority**: Utility for creating component variants

## Development Tools
- **Vite**: Frontend build tool and development server
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development server
- **Replit Integration**: Development environment integration and error handling

## Third-party Libraries
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **date-fns**: Date manipulation and formatting utilities
- **Zod**: Schema validation library integrated with Drizzle