#Pull real facility data from OpenStreetMap (Overpass API) and insert into the roadsos.facilities table

import os
import time
import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "roadsos"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
)
cur = conn.cursor()

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
TN_BBOX      = "8.0,76.2,13.6,80.4"

# Queries split into single node types to avoid 504 timeouts
QUERIES = [
    ("hospital",          f'[out:json][timeout:90];(node["amenity"="hospital"]({TN_BBOX}););out body;'),
    ("hospital",          f'[out:json][timeout:90];(node["healthcare"="hospital"]({TN_BBOX}););out body;'),
    ("ambulance_station", f'[out:json][timeout:90];(node["emergency"="ambulance_station"]({TN_BBOX}););out body;'),
    ("ambulance_station", f'[out:json][timeout:90];(node["amenity"="ambulance_station"]({TN_BBOX}););out body;'),
    ("police_station",    f'[out:json][timeout:90];(node["amenity"="police"]({TN_BBOX}););out body;'),
    ("rescue_service",    f'[out:json][timeout:90];(node["amenity"="fire_station"]({TN_BBOX}););out body;'),
    ("rescue_service",    f'[out:json][timeout:90];(node["emergency"="rescue_station"]({TN_BBOX}););out body;'),
]

HEADERS = {
    "User-Agent": "RoadSoS/1.0 (road safety hackathon app)",
    "Accept":     "application/json",
}

def fetch_osm(query, retries=3):
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(
                OVERPASS_URL,
                params={"data": query},
                headers=HEADERS,
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json().get("elements", [])
        except requests.exceptions.HTTPError as e:
            if resp.status_code == 504 and attempt < retries:
                wait = attempt * 10
                print(f"504 timeout, retrying in {wait}s...", end=" ", flush=True)
                time.sleep(wait)
            else:
                raise
    return []


def insert_facility(ftype, element):
    tags = element.get("tags", {})
    name = (
        tags.get("name:en")
        or tags.get("name")
        or ftype.replace("_", " ").title()
    )
    lon = element.get("lon")
    lat = element.get("lat")
    if not lon or not lat:
        return

    phone   = tags.get("phone") or tags.get("contact:phone") or None
    address = tags.get("addr:full") or tags.get("addr:street") or None
    is_24h  = tags.get("opening_hours", "").lower() in ("24/7", "mo-su 00:00-24:00")

    cur.execute(
        """
        INSERT INTO facilities (name, facility_type, address, phone, is_24hrs, geom)
        VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
        ON CONFLICT DO NOTHING
        """,
        (name, ftype, address, phone, is_24h, lon, lat),
    )


total = 0
for ftype, query in QUERIES:
    print(f"Fetching {ftype}...", end=" ", flush=True)
    try:
        elements = fetch_osm(query)
        for el in elements:
            insert_facility(ftype, el)
        conn.commit()
        print(f"{len(elements)} records inserted.")
        total += len(elements)
    except Exception as e:
        print(f"ERROR: {e}")
        conn.rollback()
    time.sleep(5)

cur.close()
conn.close()
print(f"\nDone. Total facilities seeded: {total}")
print('Verify: SELECT facility_type, COUNT(*) FROM facilities GROUP BY 1;')
