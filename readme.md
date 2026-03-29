# Vaa — Anti-Cheat Quiz Platform for Classrooms

Vaa is a mobile app built for teachers and students that solves a real problem —
students cheating on Google Forms by copying questions into ChatGPT or using
Circle to Search. Vaa blocks all of that at the OS level.

---

## The Problem

Google Forms is not built for assessments. A student can:
- Copy the question text and paste it into any AI chatbot
- Use Circle to Search to find answers instantly
- Switch tabs freely with no consequence
- Take screenshots and share questions with others

Teachers know this. But they have no simple, free alternative.

---

## The Solution

Vaa is a lightweight, free quiz platform where:
- Teachers create quizzes with MCQ or text answer questions
- Students join using a room code
- The app locks down the screen for the duration of the quiz

---

## Anti-Cheat Features

| Feature | How |
|---|---|
| Screenshots blocked | FLAG_SECURE via expo-screen-capture |
| Screen recording blocked | Same FLAG_SECURE mechanism |
| Circle to Search blocked | Uses same screen buffer — sees black |
| Auto-submit on minimize | AppState API detects background |
| Auto-submit on tab switch | AppState focus detection |
| Text selection disabled | React Native default |
| Time limit enforced | Server-side verified timer |

---

## Features

**For Teachers**
- Create quizzes with MCQ or open text questions
- Set time limits per quiz
- Generate a unique room code per quiz
- View all student results in a dashboard
- Reset a specific student's attempt if needed

**For Students**
- Join any quiz using a room code
- Answer within the time limit
- Automatic submission on timeout or if app is minimized

---

## Tech Stack

- **React Native + Expo** — cross platform mobile app
- **Supabase** — auth, database, backend
- **expo-screen-capture** — FLAG_SECURE screenshot blocking
- **AppState API** — minimize and background detection
- **Google Gemini API** — optional AI question generation

---

## Project Status

- [ ] Phase 1 — Setup
- [ ] Phase 2 — Auth screens
- [ ] Phase 3 — Core quiz flow
- [ ] Phase 4 — Anti-cheat implementation
- [ ] Phase 5 — Teacher dashboard + results
- [ ] Phase 6 — Build APK + distribute

---

## Built By

Adarsh — Diploma Computer Engineering Student, Kerala, India
GitHub: [@zilix-77](https://github.com/zilix-77)

---

## Why I Built This

I am a student. I have cheated on Google Form vivas. I know exactly how it is done
and I know exactly how to stop it. This app is the result of that.

---

*Built for classrooms. Built by a student who gets it.*