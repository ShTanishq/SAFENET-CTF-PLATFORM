# OWASP Top 10 2021 - Cybersecurity Education Platform

## Overview

This Flask-based web application provides an interactive cybersecurity education platform focused on the OWASP Top 10 2021 vulnerabilities. The platform combines educational content with hands-on CTF (Capture The Flag) challenges, allowing users to learn about web application security through practical exercises.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Bootstrap 5 for responsive UI
- **JavaScript Libraries**: 
  - jsTree for interactive vulnerability tree navigation
  - jQuery for DOM manipulation and AJAX requests
  - Font Awesome for icons
- **Styling**: Custom CSS with cybersecurity theme, Bootstrap components
- **Structure**: Base template inheritance pattern for consistent layout

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database ORM**: SQLAlchemy with Flask-SQLAlchemy extension
- **Architecture Pattern**: MVC (Model-View-Controller)
- **Session Management**: Flask sessions with configurable secret key
- **Logging**: Python logging module with DEBUG level

### Database Design
- **Primary Database**: SQLite (configurable via DATABASE_URL environment variable)
- **Connection Pooling**: Configured with pool_recycle and pool_pre_ping options
- **Schema**: Declarative base model using SQLAlchemy ORM

## Key Components

### 1. User Management System
- **User Model**: Stores user credentials, creation timestamps
- **Authentication**: Password hashing (implied but not fully implemented)
- **Relationships**: One-to-many with challenge attempts and completions

### 2. Challenge System
- **Challenge Model**: Stores OWASP category mapping, difficulty levels, flags, hints
- **Challenge Manager**: Handles vulnerable endpoint simulation for each OWASP category
- **Progress Tracking**: Tracks user attempts and completions with scoring system

### 3. Content Management
- **Static Data**: JSON files for challenges and OWASP tree structure
- **Template System**: Separate templates for different page types (info, challenges, index)
- **Interactive Tree**: jsTree-based navigation for OWASP categories

### 4. CTF Challenge Engine
- **Vulnerability Simulation**: Dedicated handlers for each OWASP Top 10 category
- **Flag Validation**: Server-side flag checking with attempt logging
- **Hint System**: Progressive hint disclosure for challenge assistance

## Data Flow

### 1. User Navigation Flow
1. User accesses main page with interactive OWASP tree
2. Tree loads from `owasp_tree.json` configuration
3. User selects vulnerability category or challenge
4. System routes to appropriate handler (info or challenge page)

### 2. Challenge Attempt Flow
1. User accesses challenge page via `/challenge/<owasp_id>`
2. Challenge data loaded from `challenges.json`
3. Vulnerable endpoint simulated based on OWASP category
4. User submits flag through challenge interface
5. Attempt logged to database with IP tracking
6. Success/failure response with optional hints

### 3. Progress Tracking Flow
1. Challenge completion creates `CompletedChallenge` record
2. Points awarded based on challenge difficulty
3. Unique constraint prevents duplicate completions
4. Leaderboard aggregates user scores

## External Dependencies

### Python Packages
- **Flask**: Web framework and routing
- **Flask-SQLAlchemy**: Database ORM integration
- **SQLAlchemy**: Database abstraction layer

### Frontend Libraries (CDN)
- **Bootstrap 5**: CSS framework for responsive design
- **Font Awesome 6**: Icon library for UI elements
- **jsTree 3.2.1**: Interactive tree component for navigation
- **jQuery**: JavaScript library for DOM manipulation

### Data Storage
- **SQLite**: Default database (development)
- **PostgreSQL**: Supported via DATABASE_URL configuration (production)

## Deployment Strategy

### Environment Configuration
- **Session Secret**: Configurable via `SESSION_SECRET` environment variable
- **Database URL**: Configurable via `DATABASE_URL` environment variable
- **Debug Mode**: Enabled for development, should be disabled in production

### Database Initialization
- Automatic table creation on app startup
- Model imports ensure all tables are created
- Connection pooling configured for production stability

### Server Configuration
- **Host**: 0.0.0.0 (all interfaces)
- **Port**: 5000 (configurable)
- **Debug**: Enabled in development mode

### Security Considerations
- Environment-based secret key management
- IP address logging for challenge attempts
- Session-based user tracking
- Input validation required for production deployment

### Scalability Notes
- SQLAlchemy connection pooling supports concurrent users
- Static content (JSON, CSS, JS) can be CDN-cached
- Challenge engine designed for stateless operation
- Database schema supports horizontal scaling with proper indexing