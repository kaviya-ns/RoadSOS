from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}"
    f"/{os.getenv('DB_NAME')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

from extensions import db
db.init_app(app)

from routes.nearby   import nearby_bp
from routes.seed     import seed_bp
from routes.contacts import contacts_bp
from routes.sms      import sms_bp
from routes.hazards     import hazards_bp
from routes.risk_zones import risk_bp

app.register_blueprint(nearby_bp,   url_prefix="/api")
app.register_blueprint(seed_bp,     url_prefix="/admin")
app.register_blueprint(contacts_bp, url_prefix="/api")
app.register_blueprint(sms_bp,      url_prefix="/api")
app.register_blueprint(hazards_bp,  url_prefix="/api")
app.register_blueprint(risk_bp,     url_prefix="/api")

@app.route("/health")
def health():
    return {"status": "ok"}, 200

if __name__ == "__main__":
    with app.app_context():
        from models import Facility, EmergencyContact, UserContact, HazardReport
        db.create_all()
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true"
    )
