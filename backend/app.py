from flask_cors import CORS
from flask import Flask
from config import CORS_ORIGINS
from routes.auth import auth_bp
from database import init_db

app = Flask(__name__)

CORS(app, origins=[CORS_ORIGINS])

app.register_blueprint(auth_bp)

init_db()

#will import the BKT logic after working on it.

@app.route('/mastery/update', methods=['POST'])
def update_mastery():
    #the main simulation for BKT, updating the user mastery parameters.
    pass

if __name__ == '__main__':
    app.run(debug=True, port=5000)


