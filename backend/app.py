from flask import Flask
from flask_cors import CORS
from config import CORS_ORIGINS
from routes.auth import auth_bp
from routes.game import game_bp
from database import init_db, SessionLocal


def create_app():
    app = Flask(__name__)
    CORS(app, origins=CORS_ORIGINS, supports_credentials=True)

    #blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(game_bp, url_prefix="/api/game")

    #DB init and seeding
    init_db()
    _seed()

    return app


def _seed():
    #Seeding levles content from JSON files.
    from challenge_service import seed_challenges
    db = SessionLocal()
    try:
        seed_challenges(db)
    except Exception as e:
        print(f"[seed] Warning: {e}")
    finally:
        db.close()


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=8080)