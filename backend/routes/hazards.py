from flask import Blueprint, request, jsonify
from sqlalchemy import text
from extensions import db
from models import HazardReport
from datetime import datetime, timezone

hazards_bp = Blueprint("hazards", __name__)

VALID_TYPES = {"accident", "pothole", "flooding", "debris", "animal", "other"}
MAX_RADIUS_KM = 50

@hazards_bp.route("/hazards", methods=["POST"])
def report_hazard():
    data        = request.get_json()
    device_id   = data.get("device_id")
    hazard_type = data.get("hazard_type")
    description = data.get("description", "")
    lat         = data.get("lat")
    lon         = data.get("lon")

    if not device_id or not hazard_type or lat is None or lon is None:
        return jsonify({"error": "device_id, hazard_type, lat, lon required"}), 400

    if hazard_type not in VALID_TYPES:
        return jsonify({"error": f"hazard_type must be one of {sorted(VALID_TYPES)}"}), 400

    hazard = HazardReport(
        device_id   = device_id,
        hazard_type = hazard_type,
        description = description,
        geom        = f"SRID=4326;POINT({lon} {lat})",
    )
    db.session.add(hazard)
    db.session.commit()

    return jsonify({
        "message": "Hazard reported",
        "hazard":  hazard.to_dict(),
    }), 201


@hazards_bp.route("/hazards/nearby", methods=["GET"])
def get_nearby_hazards():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon required"}), 400

    try:
        radius_km = min(float(request.args.get("radius_km", 50)), MAX_RADIUS_KM)
    except ValueError:
        radius_km = 50

    radius_m = radius_km * 1000

    sql = text("""
	    SELECT
		id, device_id, hazard_type, description,
		upvotes, downvotes, created_at,
		ST_X(geom::geometry) AS lon,
		ST_Y(geom::geometry) AS lat,
		ST_Distance(
		    geom::geography,
		    ST_MakePoint(:lon, :lat)::geography
		) AS distance_m
	    FROM hazard_reports
	    WHERE ST_DWithin(
		geom::geography,
		ST_MakePoint(:lon, :lat)::geography,
		:radius_m
	    )
	    ORDER BY created_at DESC
    """)

    rows = db.session.execute(sql, {"lat": lat, "lon": lon, "radius_m": radius_m}).fetchall()

    results = [
	    {
		"id":          row.id,
		"type":        row.hazard_type,
		"description": row.description,
		"upvotes":     row.upvotes,
		"downvotes":   row.downvotes,
		"lat":         row.lat,
		"lon":         row.lon,
		"distance_km": round(row.distance_m / 1000, 2),
		"created_at":  row.created_at.isoformat(),
	    }
	    for row in rows
    ]

    return jsonify({"count": len(results), "hazards": results}), 200

@hazards_bp.route("/hazards/<int:hazard_id>/upvote", methods=["POST"])
def upvote_hazard(hazard_id):
    hazard = HazardReport.query.get(hazard_id)
    if not hazard:
        return jsonify({"error": "Hazard not found"}), 404

    hazard.upvotes  += 1
    sql = text("""
	    UPDATE hazard_reports
	    SET upvotes = upvotes + 1
	    WHERE id = :id
	    RETURNING upvotes
    """)
    
    row = db.session.execute(sql, {"id": hazard_id}).fetchone()
    db.session.commit()

    return jsonify({"upvotes": row.upvotes}), 200

@hazards_bp.route("/hazards/<int:hazard_id>/downvote", methods=["POST"])
def downvote_hazard(hazard_id):
    hazard = HazardReport.query.get_or_404(hazard_id)
    hazard.downvotes = (hazard.downvotes or 0) + 1
    if hazard.downvotes >= 3 and hazard.downvotes > hazard.upvotes:
        db.session.delete(hazard)
        db.session.commit()
        return jsonify({"status": "removed", "message": "Hazard removed after 3 downvotes"})
    db.session.commit()
    return jsonify({"status": "ok", "downvotes": hazard.downvotes})
    
@hazards_bp.route("/hazards/<int:hazard_id>/unupvote", methods=["POST"])
def unupvote_hazard(hazard_id):
    sql = text("UPDATE hazard_reports SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = :id RETURNING upvotes")
    row = db.session.execute(sql, {"id": hazard_id}).fetchone()
    db.session.commit()
    return jsonify({"upvotes": row.upvotes}), 200

@hazards_bp.route("/hazards/<int:hazard_id>/undownvote", methods=["POST"])
def undownvote_hazard(hazard_id):
    sql = text("UPDATE hazard_reports SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = :id RETURNING downvotes")
    row = db.session.execute(sql, {"id": hazard_id}).fetchone()
    db.session.commit()
    return jsonify({"downvotes": row.downvotes}), 200
       
@hazards_bp.route("/hazards/<int:hazard_id>", methods=["DELETE"])
def delete_hazard(hazard_id):
    device_id = request.args.get("device_id")
    hazard    = HazardReport.query.filter_by(id=hazard_id, device_id=device_id).first()

    if not hazard:
        return jsonify({"error": "Hazard not found or not yours"}), 404

    db.session.delete(hazard)
    db.session.commit()
    return jsonify({"message": "Hazard removed"}), 200
