# Overview

VoiceTracker is a smart expense tracking web application that leverages voice input for seamless expense recording. The application allows users to simply speak their expenses (e.g., "Spent 25 dollars on coffee this morning") and automatically categorizes them using intelligent parsing. Built as a full-stack application with React frontend and Express backend, it features comprehensive expense management, budget tracking, reporting capabilities, and supports both voice input and traditional manual entry methods.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, built using Vite for development and bundling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS for styling with shadcn/ui component library
- **Voice Processing**: Web Speech API for browser-based speech-to-text recognition
- **Charts**: Chart.js for data visualization and reporting
- **Form Handling**: React Hook Form with Zod schema validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API endpoints for CRUD operations
- **File Processing**: Planned OCR integration using Tesseract.js for invoice scanning

## Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: 
  - Users table (mandatory for Replit Auth)
  - Expenses table with user relationships
  - Budgets table for spending limits
  - Sessions table for authentication state

## Key Features Architecture
- **Voice Input**: Browser-based speech recognition with fallback to text input
- **Auto-categorization**: Keyword-based expense categorization system
- **Budget Management**: Category-based budget setting with progress tracking
- **Report Generation**: Filtered reports with date ranges and category breakdowns
- **File Upload**: Planned invoice scanning with OCR text extraction

## Data Flow Patterns
- **Authentication**: Replit Auth handles user authentication and session management
- **API Communication**: Centralized API client with error handling and unauthorized redirects
- **Real-time Updates**: Query invalidation for immediate UI updates after mutations
- **Voice Processing**: Client-side speech processing with parsed data sent to backend

# External Dependencies

## Authentication & Hosting
- **Replit Auth**: Integrated OpenID Connect authentication system
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling

## Frontend Libraries
- **Radix UI**: Accessible component primitives for the design system
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Chart.js**: Data visualization library for expense reports and analytics
- **React Hook Form**: Performant form library with validation
- **Zod**: TypeScript-first schema validation library

## Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## Planned Integrations
- **Tesseract.js**: Browser-based OCR for invoice text extraction
- **File Upload**: Multer or similar for secure file handling
- **Export Libraries**: jsPDF for PDF generation, PapaParse for CSV exports
