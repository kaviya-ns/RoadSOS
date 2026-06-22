from flask import Blueprint, request, jsonify
from sqlalchemy import text
from extensions import db


nearby_bp = Blueprint("nearby", __name__)

VALID_TYPES  = {"hospital", "ambulance_station", "rescue_service", "police_station"}
DEFAULT_KM   = 10       
MAX_KM       = 50       
MAX_RESULTS  = 10       


@nearby_bp.route("/nearby", methods=["GET"])
def get_nearby():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon are required and must be numbers"}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return jsonify({"error": "lat or lon out of valid range"}), 400

    ftype = request.args.get("type", None)
    if ftype and ftype not in VALID_TYPES:
        return jsonify({"error": f"type must be one of {sorted(VALID_TYPES)}"}), 400

    try:
        radius_km = min(float(request.args.get("radius_km", DEFAULT_KM)), MAX_KM)
    except ValueError:
        radius_km = DEFAULT_KM

    radius_m = radius_km * 1000

    type_filter = "AND facility_type = :ftype" if ftype else ""

    sql = text(f"""
        SELECT
            id,
            name,
            facility_type,
            address,
            phone,
            is_24hrs,
            ST_X(geom::geometry)                                    AS lon,
            ST_Y(geom::geometry)                                    AS lat,
            ST_Distance(geom::geography, ST_MakePoint(:lon, :lat)::geography) AS distance_m
        FROM facilities
        WHERE
            ST_DWithin(
                geom::geography,
                ST_MakePoint(:lon, :lat)::geography,
                :radius_m
            )
            {type_filter}
        ORDER BY distance_m
        LIMIT :limit
    """)

    params = {"lat": lat, "lon": lon, "radius_m": radius_m, "limit": MAX_RESULTS}
    if ftype:
        params["ftype"] = ftype

    rows = db.session.execute(sql, params).fetchall()

    results = [
        {
            "id":          row.id,
            "name":        row.name,
            "type":        row.facility_type,
            "address":     row.address,
            "phone":       row.phone,
            "is_24hrs":    row.is_24hrs,
            "lat":         row.lat,
            "lon":         row.lon,
            "distance_km": round(row.distance_m / 1000, 2),
        }
        for row in rows
    ]

    return jsonify({
        "query": {
            "lat":       lat,
            "lon":       lon,
            "type":      ftype or "all",
            "radius_km": radius_km,
        },
        "count":   len(results),
        "results": results,
    }), 200


@nearby_bp.route("/nearby/all", methods=["GET"])
def get_nearby_all():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon are required"}), 400

    try:
        radius_km = min(float(request.args.get("radius_km", DEFAULT_KM)), MAX_KM)
    except ValueError:
        radius_km = DEFAULT_KM

    radius_m = radius_km * 1000

    sql = text("""
        SELECT DISTINCT ON (facility_type)
            id,
            name,
            facility_type,
            address,
            phone,
            is_24hrs,
            ST_X(geom::geometry)                                        AS lon,
            ST_Y(geom::geometry)                                        AS lat,
            ST_Distance(geom::geography, ST_MakePoint(:lon,:lat)::geography) AS distance_m
        FROM facilities
        WHERE ST_DWithin(
            geom::geography,
            ST_MakePoint(:lon, :lat)::geography,
            :radius_m
        )
        ORDER BY facility_type, distance_m
    """)

    rows = db.session.execute(sql, {"lat": lat, "lon": lon, "radius_m": radius_m}).fetchall()

    results = {}
    for row in rows:
        results[row.facility_type] = {
            "id":          row.id,
            "name":        row.name,
            "type":        row.facility_type,
            "address":     row.address,
            "phone":       row.phone,
            "is_24hrs":    row.is_24hrs,
            "lat":         row.lat,
            "lon":         row.lon,
            "distance_km": round(row.distance_m / 1000, 2),
        }

    return jsonify({
        "query":   {"lat": lat, "lon": lon, "radius_km": radius_km},
        "results": results,
    }), 200
