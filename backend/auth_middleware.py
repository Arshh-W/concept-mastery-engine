"""
Provides get_current_user() and require_auth() for auth on routes
Returns (user_id, email) or raises a 401 response.
"""

from functools import wraps
from flask import request, jsonify, g
from security import decode_access_token
from schemas import TokenData


def get_current_user():
    #get token from header, decodes and validates it, returns the user info or any error
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401

    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    try:
        return TokenData(**payload)
    except Exception:
        return jsonify({"error": "Malformed token payload"}), 401


def require_auth(f):
    #Decorator that injects token_data as first argument to the route
    @wraps(f)
    def decorated(*args, **kwargs):
        result = get_current_user()
        if isinstance(result, tuple):   
            return result
        return f(result, *args, **kwargs)
    return decorated