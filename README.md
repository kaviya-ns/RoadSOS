# 🚨 RoadSoS — Emergency Road Safety Assistant


RoadSoS is a mobile-first Progressive Web App (PWA) that provides instant, location-based access to nearby emergency services during road accidents — and actively monitors for accidents before they happen.

---

## Problem Statement

Road accidents in India cause over 150,000 deaths annually. A major factor is the delay between an accident occurring and help arriving, caused by:

- Injured persons unable to call for help
- Bystanders unsure which hospital or number to contact
- Difficulty communicating exact location during an emergency
- No automatic notification to the victim's family

RoadSoS addresses all four problems in one application.

---

## Features

### Nearby Facilities
Instantly finds the nearest hospital, ambulance station, police station, and rescue service using GPS. Powered by **14,666+ Tamil Nadu facilities** sourced from OpenStreetMap.

- 4 category cards on home screen with nearest facility + distance
- Full list of up to 10 nearby facilities sorted by distance
- Interactive Leaflet map with one-tap **Call** and **Directions** buttons

### Journey Mode
Opt-in monitoring activated before travel. Three processes run simultaneously:

**1. Accident Detection**
- Watches GPS speed via `watchPosition`
- Listens for accelerometer impact spikes via `DeviceMotion API`
- Speed drop from >25 km/h to ~0 + impact spike → 60-second SOS countdown
- User can tap **I'm OK** to cancel or **Get Help Now** to send immediately
- No response → SOS triggers automatically

**2. Automatic SMS Alert (Twilio)**
- Sends SMS to all saved emergency contacts with Google Maps location link and nearest hospital name
- Falls back to pre-filled WhatsApp message if SMS fails

**3. Proximity Warnings**
- Checks user GPS every 5 seconds against 18 TN risk zones + active hazard reports
- Warning banner slides up when within 2km of a hazard or risk zone
- Critical zones trigger phone vibration
- Dismissed per-zone for 5 minutes to avoid repeated alerts

### Live Hazard Map
Community-driven real-time hazard reporting:
- Report accidents, potholes, flooding, debris, or animals on the road
- Reports visible to all users within **50km** as colored emoji pins
- Upvote ("Still there") extends hazard life by 30 minutes
- Auto-expires after 2 hours
- Multiple hazards at the same location shown in a stacked panel

### Risk Zones Map
18 pre-loaded high-accident Tamil Nadu highway stretches displayed as a heatmap:
- Color-coded by risk level: Critical (red), High (orange), Moderate (amber)
- Filter by risk level
- Tap any zone to see accident count, peak hours, reason, and distance from you
- Covers NH44, NH48, NH83, NH85, ECR, and Chennai city hotspots

### Emergency Contacts
- Save up to 3 personal contacts (name + phone)
- Stored by device fingerprint — no account or login needed
- Automatically alerted via Twilio SMS on SOS trigger

### Voice / Hold SOS
Floating button on all screens:
- **Voice mode**: Say *"emergency"*, *"help"*, or *"SOS"* → instant SOS
- **Hold mode** (auto-fallback if mic unavailable): Hold 3 seconds → SOS
- Works even when hands are on the wheel or the user is injured

### Accessible Mode
Toggle in top-right corner on every screen:
- High-contrast white background with dark text
- Larger fonts (20px base) and bolder elements
- Minimum 60px tap targets for stress-free use in emergencies

### Progressive Web App (PWA)
- Installable on Android Chrome via *Add to Home Screen*
- Opens fullscreen with its own icon, no browser bar
- Service worker for basic caching

---

## Architecture

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | Mobile-first single-page app |
| Backend | Flask (Python) | REST API server |
| Database | PostgreSQL + PostGIS | Spatial queries and user data |
| Maps | Leaflet.js + OpenStreetMap | Interactive maps |
| SMS | Twilio | Automatic emergency SMS |
| Location | Browser Geolocation API | GPS coordinates and speed |
| Motion | DeviceMotion API | Accelerometer impact detection |
| Speech | Web Speech API | Voice SOS trigger |
| PWA | Web App Manifest + Service Worker | Installable on Android |

---

## Project Structure

```
RoadSoS/
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── models.py               # SQLAlchemy models
│   ├── extensions.py           # DB instance
│   ├── requirements.txt
│   ├── seed_osm.py             # OSM facility data fetcher
│   ├── seed_risk_zones.py      # Risk zone seeder
│   └── routes/
│       ├── nearby.py           # Facility search
│       ├── contacts.py         # Emergency contacts CRUD
│       ├── sms.py              # Twilio SMS
│       ├── hazards.py          # Hazard reports
│       ├── risk_zones.py       # Risk zone data
│       └── seed.py             # Emergency numbers seed
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main router + state
│   │   ├── api.js              # All backend calls
│   │   ├── constants.js        # Emergency numbers + config
│   │   ├── components/
│   │   │   ├── SplashScreen.jsx
│   │   │   ├── HomeScreen.jsx
│   │   │   ├── FacilityList.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── AccidentAlert.jsx
│   │   │   ├── ContactsScreen.jsx
│   │   │   ├── HazardMap.jsx
│   │   │   ├── RiskMap.jsx
│   │   │   ├── ProximityWarning.jsx
│   │   │   ├── VoiceSOSButton.jsx
│   │   │   └── A11yToggle.jsx
│   │   ├── hooks/
│   │   │   ├── useAccidentDetection.js
│   │   │   ├── useProximityWarning.js
│   │   │   └── useVoiceSOS.js
│   │   └── context/
│   │       └── AccessibilityContext.jsx
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+ with PostGIS extension
- Twilio account (free trial sufficient for demo)
- ngrok (for HTTPS on mobile)

### 1. Database Setup

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE roadsos;
CREATE USER roadsos_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE roadsos TO roadsos_user;
\q
```
```bash
sudo -u postgres psql -d roadsos -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
DB_USER=roadsos_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=roadsos
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=+1xxxxxxxxxx
FLASK_DEBUG=true
```

```bash
python app.py
```

Seed the database:
```bash
# Seed emergency contact numbers
curl -X POST http://localhost:5001/admin/seed-contacts

# Seed TN facility data from OpenStreetMap (~2 min)
python seed_osm.py

# Seed risk zones
python seed_risk_zones.py

# Verify
curl http://localhost:5001/admin/status
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev -- --host
```

### 4. Mobile Testing (HTTPS required for GPS + motion)

```bash
# Terminal 3 — expose frontend over HTTPS
ngrok http 3000
```

Open the `https://xxxx.ngrok.io` URL on your Android phone in Chrome.

> **Note:** GPS speed and DeviceMotion events require HTTPS on Android. The local `http://` address will not work for Journey Mode on mobile.

---

## Testing Journey Mode

For indoor/demo testing, lower the detection thresholds in `useAccidentDetection.js`:

```javascript
const SPEED_THRESHOLD_KMH = 5;   // default: 25
const IMPACT_THRESHOLD    = 5;   // default: 15
```

Then:
1. Add your phone number in the Contacts screen
2. Turn on Journey Mode
3. Walk briskly and stop suddenly while shaking the phone
4. 60-second countdown appears → let it run or tap **Get Help Now**
5. Twilio SMS sent to saved contacts automatically

For proximity warning testing, increase `WARNING_RADIUS_M` in `useProximityWarning.js` to `500000` to trigger immediately anywhere in TN.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/nearby/all` | Nearest facility of each type |
| GET | `/api/nearby` | Facilities by type and radius |
| POST | `/api/contacts` | Save emergency contact |
| GET | `/api/contacts` | Fetch contacts by device ID |
| DELETE | `/api/contacts/:id` | Delete contact |
| POST | `/api/sms/alert` | Send Twilio SMS to all contacts |
| GET | `/api/hazards/nearby` | Active hazards near location |
| POST | `/api/hazards` | Report new hazard |
| POST | `/api/hazards/:id/upvote` | Upvote hazard |
| GET | `/api/risk-zones` | Risk zones near location |
| GET | `/admin/status` | Database record counts |

---

## Data Sources

| Data | Source | Count |
|---|---|---|
| Hospitals / Trauma Centres | OpenStreetMap Overpass API | 14,666 |
| Police Stations | OpenStreetMap Overpass API | 729 |
| Rescue Services | OpenStreetMap Overpass API | 77 |
| Ambulance Stations | OpenStreetMap Overpass API | 13 |
| Emergency Contact Numbers | Government of India / TN DMA | 8 |
| Risk Zones | NCRB + TN Police accident data | 18 |

All OpenStreetMap data is used under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/).

---

## Privacy

- **Location is never stored server-side.** It is used only in-memory to query nearby facilities.
- **Journey Mode is fully opt-in.** No background processes run when it is off.
- **No login or account system.** Contacts are stored by device fingerprint only.
- **Device fingerprint** is derived from browser properties (screen size, timezone, user agent) and is not linked to any external identity.
- All data is transmitted over HTTPS.

---

## Tech Stack

**Backend:** Flask · SQLAlchemy · GeoAlchemy2 · PostGIS · Twilio · psycopg2 · python-dotenv · gunicorn

**Frontend:** React 18 · Vite · Leaflet.js · react-leaflet

**APIs:** Browser Geolocation API · DeviceMotion API · Web Speech API

**Infrastructure:** PostgreSQL · PostGIS · OpenStreetMap · ngrok

---

