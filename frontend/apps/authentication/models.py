# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from flask_login import UserMixin
from flask import session

from apps import  login_manager

from apps.authentication.util import hash_pass



class Users(UserMixin):
    def __init__(self, id, username, token):
        self.id = id
        self.username = username
        self.token = token

@login_manager.user_loader
def load_user(user_id):
    user_data = session.get('user')
    if user_data and user_data['id'] == int(user_id):
        return Users(user_data['id'], user_data['username'], user_data['token'])
    return None
