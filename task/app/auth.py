# app/auth.py
from flask import Blueprint, request, jsonify, current_app
import requests
from functools import wraps

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split()[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            response = requests.get(f"{current_app.config['AUTH_API_URL']}/verify-token", headers={'Authorization': f'Bearer {token}'})
            response.raise_for_status()
        except requests.exceptions.HTTPError as err:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    response = requests.post(f"{current_app.config['AUTH_API_URL']}/login", json={'username': data['username'], 'password': data['password']})
    if response.status_code != 200:
        return jsonify({'message': 'Login failed!'}), 401
    return jsonify(response.json())
