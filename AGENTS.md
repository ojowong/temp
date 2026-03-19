# InnerCircle Frontend — Codex Agent Instructions

## Project Overview
React Native (Expo) frontend for InnerCircle group scheduling app.
Backend API runs at http://localhost:3000/api/v1

## Stack
- React Native with Expo
- TypeScript
- React Navigation (native stack + bottom tabs)
- Axios for API calls (src/services/api.ts)
- Zustand for auth state (src/store/authStore.ts)
- React Hook Form + Zod for form validation
- @expo/vector-icons for icons

## Colors
Import from src/constants/colors.ts
Primary: #1E3A5F
Accent: #4A90D9

## Code Style
- TypeScript everywhere — no plain .js files
- Functional components only — no class components
- No inline styles — use StyleSheet.create()
- All API calls go through src/services/api.ts
- Auth token handled automatically by axios interceptor
- Always handle loading and error states in screens

## File Structure
src/screens/auth/        — LoginScreen, RegisterScreen
src/screens/groups/      — HomeScreen, GroupDetailScreen, CreateGroupScreen
src/screens/schedule/    — ScheduleRequestScreen, SuggestionsScreen
src/screens/profile/     — ProfileScreen
src/screens/availability/— AvailabilityScreen
src/components/common/   — reusable components
src/navigation/          — RootNavigator, AuthNavigator, AppNavigator
src/services/            — api.ts, authService.ts, groupService.ts
src/store/               — authStore.ts
src/constants/           — colors.ts, config.ts

## API Response Shape
Success: { data: { ... } } or { data: [...], pagination: { ... } }
Error: { error: { code: string, message: string } }

## Navigation Structure
RootNavigator
├── AuthNavigator (if not logged in)
│   ├── LoginScreen
│   └── RegisterScreen
└── AppNavigator (if logged in)
    ├── HomeScreen (tab)
    ├── ProfileScreen (tab)
    └── AvailabilityScreen (tab)
    
Modals/Stack screens pushed on top:
- GroupDetailScreen
- CreateGroupScreen
- ScheduleRequestScreen
- SuggestionsScreen

## What NOT To Do
- Never store tokens anywhere except AsyncStorage via authStore
- Never make API calls directly in components — use service files
- Never use inline styles
- Never use class components
- Never hardcode the API URL — use src/constants/config.ts