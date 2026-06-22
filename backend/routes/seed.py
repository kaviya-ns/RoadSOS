from flask import Blueprint, jsonify
from extensions import db
from models import EmergencyContact

seed_bp = Blueprint("seed", __name__)

EMERGENCY_CONTACTS = [
    {"label": "National Ambulance",        "number": "108",            "category": "ambulance",      "is_national": True},
    {"label": "National Police",           "number": "100",            "category": "police",         "is_national": True},
    {"label": "National Fire",             "number": "101",            "category": "fire",           "is_national": True},
    {"label": "National Disaster",         "number": "108",            "category": "disaster",       "is_national": True},
    {"label": "Women Helpline",            "number": "1091",           "category": "women_helpline", "is_national": True},
    {"label": "Child Helpline",            "number": "1098",           "category": "child_helpline", "is_national": True},
    {"label": "TN Road Accident Helpline", "number": "1073",           "category": "ambulance",      "is_national": False},
    {"label": "TN Police Control Room",    "number": "044-23452360",   "category": "police",         "is_national": False},
]


@seed_bp.route("/seed-contacts", methods=["POST"])
def seed_contacts():
    try:
        # clear existing
        db.session.query(EmergencyContact).delete()

        for c in EMERGENCY_CONTACTS:
            db.session.add(EmergencyContact(
                label       = c["label"],
                number      = c["number"],
                category    = c["category"],
                is_national = c["is_national"],
                state       = "Tamil Nadu",
            ))

        db.session.commit()
        return jsonify({
            "status":  "ok",
            "message": f"{len(EMERGENCY_CONTACTS)} emergency contacts seeded.",
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@seed_bp.route("/status", methods=["GET"])
def status():
    from sqlalchemy import text
    rows = db.session.execute(text("""
        SELECT facility_type, COUNT(*) AS count
        FROM facilities
        GROUP BY facility_type
        ORDER BY facility_type
    """)).fetchall()

    contact_count = db.session.query(EmergencyContact).count()

    return jsonify({
        "facilities":        {row.facility_type: row.count for row in rows},
        "emergency_contacts": contact_count,
    }), 200
