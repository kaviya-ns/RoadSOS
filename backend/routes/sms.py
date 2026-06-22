from flask import Blueprint, request, jsonify
from twilio.rest import Client
from models import UserContact
import os

sms_bp = Blueprint("sms", __name__)

@sms_bp.route("/sms/alert", methods=["POST"])
def send_alert():
    print("SMS route hit")  
    data      = request.get_json()
    print("data received:", data)
    device_id = data.get("device_id")
    lat = float(data.get('lat'))
    lon = float(data.get('lon'))
    print(f"device_id={device_id} lat={lat} lon={lon}") 
    hospital  = data.get("nearest_hospital", None)

    if not device_id or lat is None or lon is None:
        return jsonify({"error": "device_id, lat and lon are required"}), 400

    # fetch saved contacts for this device
    contacts = UserContact.query.filter_by(device_id=device_id).all()
    if not contacts:
        return jsonify({"error": "No emergency contacts saved for this device"}), 404

    # build message
    maps_link = f"https://maps.google.com/?q={lat},{lon}"
    message   = f"ACCIDENT ALERT. Location: {maps_link}"
    if hospital:
	    message += f" Nearest hospital: {hospital}."
    # send via Twilio
    client = Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN"),
    )
    from_number = os.getenv("TWILIO_PHONE")

    results = []
    errors  = []

    for contact in contacts:
        try:
            msg = client.messages.create(
                body=message,
                from_=from_number,
                to=contact.phone,
            )
            results.append({
                "name":   contact.name,
                "phone":  contact.phone,
                "status": msg.status,
            })
        except Exception as e:
            errors.append({
                "name":  contact.name,
                "phone": contact.phone,
                "error": str(e),
            })

    return jsonify({
        "sent":   len(results),
        "failed": len(errors),
        "results": results,
        "errors":  errors,
    }), 200
