from flask_cors import CORS
from flask import Flask, Blueprint
from config import CORS_ORIGINS
from routes.auth import auth_bp
from database import init_db


app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS)

api_bp = Blueprint('api', __name__, url_prefix='/api')

app.register_blueprint(auth_bp, url_prefix='/api/auth')

init_db()


@app.route('/mastery/update', methods=['POST'])
def update_mastery():
    pass

if __name__ == '__main__':
    app.run(debug=True, port=8080)


