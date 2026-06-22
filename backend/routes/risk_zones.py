from flask import Blueprint, request, jsonify
from sqlalchemy import text
from extensions import db

risk_bp = Blueprint("risk", __name__)

@risk_bp.route("/risk-zones", methods=["GET"])
def get_risk_zones():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon required"}), 400

    try:
        radius_km = min(float(request.args.get("radius_km", 100)), 200)
        min_risk  = float(request.args.get("min_risk", 0.0))
    except ValueError:
        radius_km = 100
        min_risk  = 0.0

    sql = text("""
        SELECT
            id,
            name,
            highway,
            risk_score,
            peak_hours,
            accident_count,
            reason,
            ST_X(geom::geometry) AS lon,
            ST_Y(geom::geometry) AS lat,
            ST_Distance(
                geom::geography,
                ST_MakePoint(:lon, :lat)::geography
            ) AS distance_m
        FROM risk_zones
        WHERE
            risk_score >= :min_risk
            AND ST_DWithin(
                geom::geography,
                ST_MakePoint(:lon, :lat)::geography,
                :radius_m
            )
        ORDER BY risk_score DESC
    """)

    rows = db.session.execute(sql, {
        "lat":      lat,
        "lon":      lon,
        "radius_m": radius_km * 1000,
        "min_risk": min_risk,
    }).fetchall()

    results = [
        {
            "id":             row.id,
            "name":           row.name,
            "highway":        row.highway,
            "risk_score":     round(row.risk_score, 2),
            "risk_level":     _risk_level(row.risk_score),
            "peak_hours":     row.peak_hours,
            "accident_count": row.accident_count,
            "reason":         row.reason,
            "lat":            row.lat,
            "lon":            row.lon,
            "distance_km":    round(row.distance_m / 1000, 1),
        }
        for row in rows
    ]

    return jsonify({"count": len(results), "zones": results}), 200


def _risk_level(score):
    if score >= 0.9: return "critical"
    if score >= 0.8: return "high"
    if score >= 0.7: return "moderate"
    return "low"
