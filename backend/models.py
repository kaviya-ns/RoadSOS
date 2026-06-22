from extensions import db
from geoalchemy2 import Geometry


class Facility(db.Model):
    __tablename__ = "facilities"

    id            = db.Column(db.Integer,  primary_key=True)
    name          = db.Column(db.Text,     nullable=False)
    facility_type = db.Column(db.Text,     nullable=False)
    address       = db.Column(db.Text,     nullable=True)
    phone         = db.Column(db.Text,     nullable=True)
    is_24hrs      = db.Column(db.Boolean,  default=True)
    geom          = db.Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    def to_dict(self, distance_m=None):
        return {
            "id":          self.id,
            "name":        self.name,
            "type":        self.facility_type,
            "address":     self.address,
            "phone":       self.phone,
            "is_24hrs":    self.is_24hrs,
            "distance_km": round(distance_m / 1000, 2) if distance_m else None,
        }


class EmergencyContact(db.Model):
    __tablename__ = "emergency_contacts"

    id          = db.Column(db.Integer, primary_key=True)
    label       = db.Column(db.Text,    nullable=False)
    number      = db.Column(db.Text,    nullable=False)
    category    = db.Column(db.Text,    nullable=False)
    is_national = db.Column(db.Boolean, default=True)
    state       = db.Column(db.Text,    default="Tamil Nadu")

    def to_dict(self):
        return {
            "id":          self.id,
            "label":       self.label,
            "number":      self.number,
            "category":    self.category,
            "is_national": self.is_national,
        }


class UserContact(db.Model):
    __tablename__ = "user_contacts"

    id         = db.Column(db.Integer,  primary_key=True)
    device_id  = db.Column(db.Text,     nullable=False)
    name       = db.Column(db.Text,     nullable=False)
    phone      = db.Column(db.Text,     nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id":    self.id,
            "name":  self.name,
            "phone": self.phone,
        }


class HazardReport(db.Model):
    __tablename__ = "hazard_reports"

    id          = db.Column(db.Integer,  primary_key=True)
    device_id   = db.Column(db.Text,     nullable=False)
    hazard_type = db.Column(db.Text,     nullable=False)
    description = db.Column(db.Text,     nullable=True)
    upvotes     = db.Column(db.Integer,  default=0)
    downvotes   = db.Column(db.Integer, default=0) 
    geom        = db.Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    created_at  = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id":          self.id,
            "type":        self.hazard_type,
            "description": self.description,
            "upvotes":     self.upvotes,
            "downvotes":   self.downvotes, 
            "created_at":  self.created_at.isoformat() if self.created_at else None,
        }
