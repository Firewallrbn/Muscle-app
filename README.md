# Muscle App

## 1. Project Overview
Muscle App is a mobile fitness application built with React Native and Expo. It allows users to create workout routines, explore exercises, track progress, and interact with an AI-powered virtual coach. The project was developed as an MVP as required by the Third Term Project guidelines.

## 2. Features
### 2.1 Core Features
- User authentication (Supabase)
- Exercise search (ExerciseDB API)
- Routine creation
- Workout session tracking
- Progress charts
- AI Assistant (Gemini)
- Local caching with AsyncStorage

### 2.2 Technical Features
- High-fidelity UI following Figma
- React Navigation tab system
- External API integration
- External libraries (chart-kit, AsyncStorage, etc.)

## 3. Architecture
- Frontend: React Native + Expo
- Backend: Supabase (Authentication, Database)
- External API: ExerciseDB (RapidAPI)
- AI: Gemini
- Local Storage: AsyncStorage
- State Management: Context API

## 4. Technologies Used
- React Native
- Expo
- Supabase
- Gemini API
- RapidAPI ExerciseDB
- React Navigation
- React Native Chart Kit
- TypeScript

## 5. Installation

### 5.1 Clone Repository
git clone https://github.com/Firewallrbn/Muscle-app

### 5.2 Install Dependencies
npm install

### 5.3 Environment Variables
Create a `.env` file:
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_RAPIDAPI_KEY=
GEMINI_API_KEY=

### 5.4 Run Application
npx expo start

## 6. Folder Structure
/app
/components
/Context
/utils

bash
Copiar código

## 7. Documentation
Full documentation available in GitHub Wiki:
https://github.com/Firewallrbn/Muscle-app/wiki

