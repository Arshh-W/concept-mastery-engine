#BKT Controller 

from flask import Flask, request, jsonify

app = Flask(__name__)

# #will import the BKT logic after working on it.

# @app.route('/mastery/update', methods=['POST'])
# def update_mastery():
#     #the main simulation for BKT, updating the user mastery parameters.

if __name__ == '__main__':
    app.run(debug=True, port=5000)