# Usa una imagen base de Python
FROM python:3.9-slim

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos requirements.txt y .env al contenedor
COPY requirements.txt ./
COPY .env ./

# Instala las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación
COPY . .

# Copia el script de entrada
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expone el puerto en el que la aplicación correrá
EXPOSE 5000

# Establece la variable de entorno para Flask
ENV FLASK_APP run.py

# Comando para ejecutar la aplicación usando el script de entrada
ENTRYPOINT ["/entrypoint.sh"]
#CMD ["flask", "run", "--host=0.0.0.0 --port=5001"]
CMD ["python", "run.py"]
