from flask import Blueprint, request, jsonify
from extensions import db
from models import UserContact

contacts_bp = Blueprint("contacts", __name__)

MAX_CONTACTS = 3


@contacts_bp.route("/contacts", methods=["GET"])
def get_contacts():
    device_id = request.args.get("device_id")
    if not device_id:
        return jsonify({"error": "device_id required"}), 400

    contacts = UserContact.query.filter_by(device_id=device_id).all()
    return jsonify({"contacts": [c.to_dict() for c in contacts]}), 200


@contacts_bp.route("/contacts", methods=["POST"])
def add_contact():
    data      = request.get_json()
    device_id = data.get("device_id")
    name      = data.get("name", "").strip()
    phone     = data.get("phone", "").strip()

    if not device_id or not name or not phone:
        return jsonify({"error": "device_id, name and phone are required"}), 400

    count = UserContact.query.filter_by(device_id=device_id).count()
    if count >= MAX_CONTACTS:
        return jsonify({"error": f"Maximum {MAX_CONTACTS} contacts allowed"}), 400

    contact = UserContact(device_id=device_id, name=name, phone=phone)
    db.session.add(contact)
    db.session.commit()

    return jsonify({"message": "Contact added", "contact": contact.to_dict()}), 201


@contacts_bp.route("/contacts/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    device_id = request.args.get("device_id")
    contact   = UserContact.query.filter_by(id=contact_id, device_id=device_id).first()

    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    db.session.delete(contact)
    db.session.commit()
    return jsonify({"message": "Contact deleted"}), 200
