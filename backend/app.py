from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image
import numpy as np
import io
import os

app = Flask(__name__)
CORS(app)

# Definir o diretório base do projeto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app.static_folder = os.path.join(BASE_DIR, 'galerias')

# Carregar o modelo
model_path = os.path.join(BASE_DIR, 'backend', 'insect_classifier.h5')
model = load_model(model_path)
categories = ['aranhas', 'besouro_carabideo', 'crisopideo', 'joaninhas', 'libelulas', 'mosca_asilidea', 'mosca_dolicopodidea'
              ,'mosca_sirfidea', 'mosca_taquinidea', 'percevejo_geocoris', 'percevejo_orius', 'percevejo_pentatomideo', 'percevejo_reduviideo'
              ,'tesourinha', 'vespa_parasitoide', 'vespa_predadora']

@app.route('/classify', methods=['POST'])
def classify_insect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image = request.files['image'].read()
    image = Image.open(io.BytesIO(image))
    image = image.resize((224, 224))
    image_array = img_to_array(image)
    image_array = np.expand_dims(image_array, axis=0)
    image_array /= 255.0

    predictions = model.predict(image_array)
    predicted_class = categories[np.argmax(predictions[0])]
    confidence = float(np.max(predictions[0]))

    return jsonify({
        'predicted_class': predicted_class,
        'confidence': confidence
    })

@app.route('/images/<species>', methods=['GET'])
def get_images(species):
    image_dir = os.path.join(app.static_folder, species)
    if not os.path.exists(image_dir):
        return jsonify({'error': 'Species not found'}), 404
    
    images = [f for f in os.listdir(image_dir) if f.startswith('imagem') and f.endswith('.jpg')]
    images.sort()
    image_urls = [f'/galerias/{species}/{img}' for img in images]
    return jsonify(image_urls)

@app.route('/galerias/<path:filename>')
def serve_image(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/species', methods=['GET'])
def get_species():
    return jsonify(categories)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')