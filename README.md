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
- **AI-Powered Assistant**: Built-in Microsoft Copilot Studio integration for intelligent support

### User Capabilities
- Faculty can manage their availability status
- Students can view faculty availability and join consultation queues
- Administrators can monitor and manage the system
- Public displays show real-time faculty information
- Automated notifications and reminders

## 🏗️ System Architecture

### Components
- **Frontend**: React-based user interface with TypeScript
- **Backend**: Consultation queue and status management logic
- **Integration Layer**: Microsoft Teams API integration
- **AI Module**: Microsoft Copilot Studio integration (M365 ecosystem)
- **Display System**: Public-facing dashboard system

### Technology Stack
- **Frontend**: React, TypeScript, Next.js (App Router)
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: Built on React hooks
- **Backend Integration**: Microsoft Teams API, Copilot Studio
- **Version Control**: Git/GitHub

## 🚀 Getting Started

### Prerequisites
- Node.js (recommended version 18+)
- Git
- Microsoft 365 account (for Teams and Copilot Studio)

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

## 🤖 AI Integration (Copilot Studio)

The system includes AI-powered features through Microsoft Copilot Studio:
- Intelligent consultation scheduling suggestions
- Automated FAQ responses
- Natural language query processing
- Administrative insights and analytics

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Active Development