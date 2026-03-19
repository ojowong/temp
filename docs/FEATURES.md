# InnerCircle — Frontend Feature Reference

## Core User Flows

### Auth Flow
- Register with name, email, password, timezone
- Login with email and password
- Auto-login if token exists in storage
- Logout clears all stored data

### Home Flow
- See all groups user belongs to
- Create a new group
- Tap a group to see group detail

### Group Detail Flow
- See group name, members, and their roles
- Invite new members (generates shareable link)
- See upcoming confirmed events for the group
- Tap "Schedule Something" to start scheduling flow

### Scheduling Flow
- Type natural language request e.g. "basketball this weekend"
- Select date range
- Submit and see top 3 AI-suggested time slots
- Each slot shows: time, how many members available, AI explanation
- Vote yes/no/maybe on each slot
- See confirmation when threshold is met

### Availability Flow
- See your current availability blocks
- Add manual free/busy blocks
- Set flexibility (green/yellow/red)

### Profile Flow
- See and edit name and timezone
- Connect Google Calendar
- Disconnect calendar
- Logout

## API Base URL
http://localhost:3000/api/v1

## Key API Endpoints
POST   /auth/login
POST   /auth/register
GET    /users/me
PUT    /users/me
GET    /groups
POST   /groups
GET    /groups/:id
GET    /groups/:id/members
POST   /groups/:id/invite
POST   /groups/join/:token
GET    /groups/:id/events
POST   /schedule/request
GET    /schedule/suggestions/:requestId
POST   /schedule/vote
POST   /schedule/confirm/:suggestionId
GET    /availability/me
POST   /availability/manual
GET    /calendar/connect
POST   /calendar/sync