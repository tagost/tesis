#!/bin/sh

# Inicializa las migraciones
flask db init

# Crea una primera migración
flask db migrate -m "Initial migration."

# Aplica las migraciones a la base de datos
flask db upgrade
exec "$@"
