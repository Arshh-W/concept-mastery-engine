from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
from database import SessionLocal, init_db
from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

app = Flask(__name__)

CORS(app)
init_db()

#will import the BKT logic after working on it.

@app.route('/mastery/update', methods=['POST'])
def update_mastery():
    #the main simulation for BKT, updating the user mastery parameters.

    if __name__ == '__main__':
     app.run(debug=True, port=5000)

# Registration of User
@app.route("/auth/register", methods=["POST"])
def register():
    db = SessionLocal()
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400

    new_user = User(
        email=email,
        password_hash=hash_password(password),
        name=name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return jsonify({
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.name
    }), 201

# Login 
@app.route("/auth/login", methods=["POST"])
def login():
    db = SessionLocal()
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account inactive"}), 403

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({
        "user_id": user.id,
        "email": user.email
    })

    return jsonify({
        "access_token": token,
        "token_type": "bearer"
    })

@app.route("/auth/me", methods=["GET"])
def get_me():
    db = SessionLocal()

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]

    payload = decode_access_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401

    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name
    })


if __name__ == "__main__":
    app.run(debug=True)
