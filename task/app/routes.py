# app/routes.py
from flask import Blueprint, request, jsonify
from .models import Task, db
from .auth import token_required

task_bp = Blueprint('task_bp', __name__, url_prefix='/tasks')

@task_bp.route('/', methods=['GET'])
#@token_required
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.to_dict() for task in tasks])

@task_bp.route('/<int:task_id>', methods=['GET'])
#@token_required
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify(task.to_dict())

@task_bp.route('/', methods=['POST'])
#@token_required
def create_task():
    data = request.get_json()
    new_task = Task(title=data['title'], description=data.get('description'),done=data.get('done', False))
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201

@task_bp.route('/<int:task_id>', methods=['PUT'])
#@token_required
def update_task(task_id):
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    task.title = data['title']
    task.description = data.get('description')
    task.done = data.get('done', task.done)
    db.session.commit()
    return jsonify(task.to_dict())

@task_bp.route('/<int:task_id>', methods=['DELETE'])
#@token_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'Mensaje': 'Tarea eliminada'}), 200
