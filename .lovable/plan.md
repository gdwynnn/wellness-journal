

# Wellness Journal — Implementation Plan

## Design Theme
- **Gray-toned, modern, slick UI** — dark grays with subtle gradients, clean typography, smooth animations, rounded cards, and glassmorphism-style elements throughout.

---

## Phase 1: Foundation & Auth

### 1. Landing Page
- Beautiful hero section with app name "Wellness Journal", tagline about mental health tracking
- Animated illustrations/icons, smooth scroll, feature highlights
- CTA buttons: "Get Started" / "Login"

### 2. Authentication (Login / Signup)
- Email + password signup & login using Lovable Cloud auth
- Clean tabbed or split-screen design
- Password reset flow included

### 3. User Profiles Table
- Store: display name, avatar URL, age, address, phone, notification preferences
- Auto-created on signup via database trigger

---

## Phase 2: Onboarding (New Users)

### 4. First-Time Mood Check
- AI chatbot (powered by Lovable AI) greets the user and asks about their mood today
- Conversational, friendly tone
- After the mood check, the main navigation animates in with a smooth entrance

---

## Phase 3: Core Features

### 5. Bottom Navigation Bar
Five main buttons with icons, the Journal Entry button as a raised "+" in the center:
- **Chatbot** | **Statistics** | **+ Journal** | **Account** | **Map**

### 6. Journal Entry (the "+" button)
- Title field, star rating (1–5 stars for mood), and free-text journal body
- On save: Lovable AI analyzes the entry for sentiment, provides a supportive response/suggestion
- Journal + AI response saved to database

### 7. AI Chatbot
- Full chat interface with message history
- AI is context-aware: uses the user's journal entries to provide personalized suggestions
- Restricted to wellness/mental-health topics only — off-topic or offensive prompts are politely declined
- Streaming responses for a smooth chat feel

### 8. Statistics Dashboard
- **Top bar**: Time since last journal entry, upcoming appointments
- **Mood Graph** (line chart with dots per day):
  - AI grades each journal; daily average calculated at end of day
  - Tap a dot → shows mood %, summary of that day's journals
- **Calendar**:
  - Visual distinction: dates with vs. without journal entries
  - Double-tap empty date → "No journal entered" popup
  - Tap date with entries → shows list of journals for that day, each tappable for stats
- **Recent Journals** (last 5):
  - Each shows AI sentiment analysis summary beneath
  - Tappable to view full statistics

### 9. Account Settings
- Profile editing: name, avatar, age, address, email display
- Password change
- Notification preferences (toggle switches)
- Account security section

### 10. Map (Nearby Wellness Places)
- OpenStreetMap/Leaflet map centered on user's location (browser geolocation)
- Search nearby: parks, clinics, hospitals, entertainment areas, counseling centers
- Uses Overpass API (free) to query points of interest
- Results shown as pins on map + list view below

---

## Phase 4: Polish
- Smooth page transitions and animations throughout
- Responsive design (mobile-first)
- Toast notifications for actions (journal saved, etc.)
- Loading states and skeleton screens

