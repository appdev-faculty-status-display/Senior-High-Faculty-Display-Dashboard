# FacultyBoard

A comprehensive faculty availability and consultation management system for NU Laguna Senior High School.

## 📋 Overview

FacultyBoard is a digital solution designed to streamline faculty consultations and availability tracking. The system provides real-time status updates, consultation queue management, and public display dashboards while integrating seamlessly with Microsoft Teams and leveraging AI capabilities through Microsoft Copilot Studio.

## ✨ Key Features

### Core Functionality
- **Faculty Status Management**: Real-time status states (Available, In Consultation, Busy, Offline)
- **Consultation Queue System**: Organized queue management for student consultations
- **Public Display Dashboards**: Real-time faculty availability information displayed throughout campus
- **Microsoft Teams Integration**: Seamless integration with institutional Teams infrastructure
- **Automation**: Power Automate Workflows

### User Capabilities
- Faculty can manage their availability status
- Students can view faculty availability and join consultation queues
- Administrators can monitor and manage the system
- Public displays show real-time faculty information
- Automated notifications and reminders

## 🏗️ System Architecture

### Current Architecture (Implemented)

The project is currently implemented as a two-tier web application:

- **Presentation Layer (Frontend)**: React 19 + TypeScript application powered by Vite
- **API Layer (Backend)**: Node.js + Express REST API
- **Data Layer**: MongoDB accessed through Mongoose

### Runtime Flow

```text
[Students / Faculty / Admin / Public Displays]
		   |
		   v
     [Frontend: React + TypeScript + Tailwind CSS]
		   |
		   v
	   [Backend API: Express]
		   |
		   v
	 [MongoDB Database: Mongoose ODM]
```

### Backend Structure
- `server.js`: Express bootstrap, middleware setup, MongoDB connection, and base health endpoint (`/api`)
- `routes/`: Reserved for domain API routes (consultation, faculty, status)
- `controllers/`: Reserved for request handlers/business logic
- `models/`: Reserved for MongoDB data models and schemas

### Frontend Structure
- `src/main.tsx`: React application entry point
- `src/App.tsx`: Root UI component (dashboard shell)
- `src/index.css`: Global styles and Tailwind CSS setup

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **Backend**: Node.js, Express 5
- **Database**: MongoDB + Mongoose
- **Version Control**: Git/GitHub

### Planned Integrations (Roadmap)
- Microsoft Teams API integration
- Power Automate workflows for notifications/reminders
- Microsoft Copilot Studio AI assistants

## 🚀 Getting Started

### Prerequisites
- Node.js (recommended version 18+)
- Git
- Microsoft 365 account (for Teams and Power Automate)

## 🔄 Faculty Status States

The system manages faculty through distinct status states:

| State | Description | Visibility |
|-------|-------------|------------|
| **Available** | Faculty member is free and accepting consultations | Public |
| **In Consultation** | Currently consulting with a student | Public |
| **Busy** | Faculty member is unavailable | Public |
| **Offline** | Not logged into the system | Public |

## 📊 Key Workflows

### Student Consultation Flow
1. Student views faculty availability on public dashboard
2. Student joins consultation queue for their faculty member
3. Faculty accepts consultation request
4. Notification sent to both parties
5. Consultation time recorded
6. Faculty status updated

### Faculty Status Management
1. Faculty logs in to the system
2. Sets their availability status
3. Views their consultation queue
4. Accepts/completes consultations
5. Logs out when finished

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Active Development
