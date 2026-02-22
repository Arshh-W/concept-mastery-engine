from flask import request, jsonify, Blueprint
from datetime import datetime, timezone
from database import SessionLocal
from pydantic import ValidationError
from schemas import UserCreate, UserLogin, Token, TokenData, UserResponse
from models import User
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# Registration of User
@auth_bp.route("/register", methods=["POST"])
def register():
    db = SessionLocal()
    try:     
        data = request.get_json()   
        if not data:
            return jsonify({"error" : "Invalid JSON body"}), 400
        
        validated_data = UserCreate(**data) 
    except ValidationError as e:
        return jsonify({
            "error": "validation error",
            "details" : e.errors()
        }), 400


    email = validated_data.email
    password = validated_data.password
    name = validated_data.name

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400

    new_user = User(
        email=email,
        password_hash=hash_password(password),
        username=name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return jsonify({
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.username
    }), 201

# Login 
@auth_bp.route("/login", methods=["POST"])
def login():
    db = SessionLocal()
    try:
         data = request.get_json()
         if not data:
            return jsonify({"error" : "Invalid JSON body"}), 400
         validated_data = UserLogin(**data)

    except ValidationError as e:
        return jsonify({
            "error": "validation error",
            "details" : e.errors()
        }), 400

    email = validated_data.email
    password = validated_data.password

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account inactive"}), 403

    db.commit()

    token = create_access_token({
        "user_id": user.id,
        "email": user.email
    })
    
    response = Token(access_token=token)

    return jsonify(response.model_dump()), 200

# get me
@auth_bp.route("/me", methods=["GET"])
def get_me():
    db = SessionLocal()

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401
    
    try:
       token = auth_header.split(" ")[1]
       payload = decode_access_token(token)
       token_data = TokenData(**payload)
    except Exception:
       return jsonify({"error" : "Invalid access token"}), 401

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    response = UserResponse.model_validate(user)
    return jsonify(response.model_dump()), 200
