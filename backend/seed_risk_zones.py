
#seed synthetic but realistic accident hotspots along major Tamil Nadu highways.
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "roadsos"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
)
cur = conn.cursor()


HOTSPOTS = [
    #NH44: Chennai → Madurai
    {
        "name":           "Vandalur–Kelambakkam Stretch",
        "highway":        "NH44",
        "risk_score":     0.91,
        "peak_hours":     "10 PM – 4 AM",
        "accident_count": 312,
        "reason":         "Heavy truck traffic, poor lighting, high speed corridor",
        "lat": 12.8881, "lon": 80.0714,
    },
    {
        "name":           "Sriperumbudur Bypass",
        "highway":        "NH44",
        "risk_score":     0.82,
        "peak_hours":     "6 AM – 9 AM",
        "accident_count": 198,
        "reason":         "Industrial zone congestion, sudden lane merges",
        "lat": 12.9675, "lon": 79.9536,
    },
    {
        "name":           "Kanchipuram–Tindivanam",
        "highway":        "NH44",
        "risk_score":     0.76,
        "peak_hours":     "8 PM – 12 AM",
        "accident_count": 241,
        "reason":         "Unlit highway, cattle crossing, sharp curves",
        "lat": 12.5204, "lon": 79.7036,
    },
    {
        "name":           "Villupuram Junction",
        "highway":        "NH44",
        "risk_score":     0.88,
        "peak_hours":     "7 AM – 10 AM, 5 PM – 8 PM",
        "accident_count": 287,
        "reason":         "Multi-road junction, high pedestrian activity",
        "lat": 11.9401, "lon": 79.4861,
    },
    {
        "name":           "Trichy–Dindigul Corridor",
        "highway":        "NH44",
        "risk_score":     0.79,
        "peak_hours":     "9 PM – 2 AM",
        "accident_count": 203,
        "reason":         "Overtaking accidents, no median barriers",
        "lat": 10.8505, "lon": 78.6837,
    },
    {
        "name":           "Madurai Bypass",
        "highway":        "NH44",
        "risk_score":     0.85,
        "peak_hours":     "6 PM – 11 PM",
        "accident_count": 265,
        "reason":         "High speed bypass, illegal U-turns, poor signage",
        "lat": 9.9252,  "lon": 78.1198,
    },

    #ECR: East Coast Road (Chennai → Pondicherry) 
    {
        "name":           "Thiruvanmiyur–Kovalam",
        "highway":        "ECR",
        "risk_score":     0.87,
        "peak_hours":     "Fri–Sun: 8 PM – 2 AM",
        "accident_count": 178,
        "reason":         "Weekend speeding, drunk driving, sharp coastal curves",
        "lat": 12.9165, "lon": 80.2569,
    },
    {
        "name":           "Mahabalipuram Stretch",
        "highway":        "ECR",
        "risk_score":     0.92,
        "peak_hours":     "Sat–Sun: 6 PM – 12 AM",
        "accident_count": 221,
        "reason":         "Tourist rush, overspeeding, poor road shoulders",
        "lat": 12.6269, "lon": 80.1927,
    },
    {
        "name":           "Pondicherry Entry (Tindivanam Road)",
        "highway":        "ECR",
        "risk_score":     0.74,
        "peak_hours":     "4 PM – 8 PM",
        "accident_count": 156,
        "reason":         "Speed breakers removed, high tourist volume",
        "lat": 11.9416, "lon": 79.8083,
    },

    #NH48: Chennai → Bangalore
    {
        "name":           "Ranipet–Vellore",
        "highway":        "NH48",
        "risk_score":     0.83,
        "peak_hours":     "11 PM – 5 AM",
        "accident_count": 234,
        "reason":         "Night trucks, foggy conditions, steep gradient",
        "lat": 12.9223, "lon": 79.3032,
    },
    {
        "name":           "Ambur–Krishnagiri",
        "highway":        "NH48",
        "risk_score":     0.89,
        "peak_hours":     "12 AM – 5 AM",
        "accident_count": 298,
        "reason":         "Ghat section, fog, overloaded trucks",
        "lat": 12.7906, "lon": 78.7167,
    },
    {
        "name":           "Krishnagiri–Dharmapuri",
        "highway":        "NH48",
        "risk_score":     0.94,
        "peak_hours":     "10 PM – 4 AM",
        "accident_count": 341,
        "reason":         "Most accident-prone NH stretch in TN, blind curves",
        "lat": 12.5186, "lon": 78.2137,
    },

    #NH83: Trichy → Karur 
    {
        "name":           "Musiri Junction",
        "highway":        "NH83",
        "risk_score":     0.71,
        "peak_hours":     "5 AM – 8 AM",
        "accident_count": 132,
        "reason":         "Early morning fog, school buses, farm vehicles",
        "lat": 10.9502, "lon": 78.4427,
    },
    {
        "name":           "Karur Bypass",
        "highway":        "NH83",
        "risk_score":     0.78,
        "peak_hours":     "7 PM – 10 PM",
        "accident_count": 167,
        "reason":         "Textile truck corridor, poor road markings",
        "lat": 10.9601, "lon": 78.0766,
    },

    #NH85: Coimbatore → Palani
    {
        "name":           "Pollachi–Palani Ghat",
        "highway":        "NH85",
        "risk_score":     0.93,
        "peak_hours":     "6 AM – 9 AM, 4 PM – 7 PM",
        "accident_count": 189,
        "reason":         "Steep ghat road, pilgrimage traffic, hairpin bends",
        "lat": 10.4525, "lon": 77.2239,
    },
    {
        "name":           "Coimbatore–Mettupalayam",
        "highway":        "NH85",
        "risk_score":     0.80,
        "peak_hours":     "5 AM – 8 AM",
        "accident_count": 145,
        "reason":         "Nilgiri foothills, early morning mist, sharp turns",
        "lat": 11.2985, "lon": 76.9366,
    },

    #Chennai city
    {
        "name":           "Kathipara Junction",
        "highway":        "City",
        "risk_score":     0.86,
        "peak_hours":     "8 AM – 10 AM, 6 PM – 9 PM",
        "accident_count": 203,
        "reason":         "Complex flyover junction, wrong-way entry, peak congestion",
        "lat": 13.0106, "lon": 80.2078,
    },
    {
        "name":           "Koyambedu–Poonamallee",
        "highway":        "City",
        "risk_score":     0.77,
        "peak_hours":     "7 AM – 10 AM",
        "accident_count": 168,
        "reason":         "Bus terminus chaos, pedestrian jaywalking",
        "lat": 13.0691, "lon": 80.1830,
    },
]


cur.execute("DELETE FROM risk_zones;")   

for h in HOTSPOTS:
    cur.execute("""
        INSERT INTO risk_zones
            (name, highway, risk_score, peak_hours, accident_count, reason, geom)
        VALUES (%s, %s, %s, %s, %s, %s,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326))
    """, (
        h["name"], h["highway"], h["risk_score"],
        h["peak_hours"], h["accident_count"], h["reason"],
        h["lon"], h["lat"],
    ))

conn.commit()
cur.close()
conn.close()

print(f"✓ {len(HOTSPOTS)} risk zones seeded across TN highways.")
print("Breakdown:")
highways = {}
for h in HOTSPOTS:
    highways[h["highway"]] = highways.get(h["highway"], 0) + 1
for hw, count in sorted(highways.items()):
    print(f"  {hw}: {count} zones")
