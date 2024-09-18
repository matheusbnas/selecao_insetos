import json
import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from PIL import Image

# Definir o diretório base do projeto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Carregar os dados dos arquivos JSON
categories = ['aranhas', 'besouro_carabideo', 'crisopideo', 'joaninhas', 'libelulas', 'mosca_asilidea', 'mosca_delicopodidea',
              'mosca_sirfidea', 'mosca_taquinidea', 'percevejo_geocoris', 'percevejo_orius', 'percevejo_pentatomideo', 'percevejo_reduviideo',
              'tesourinha', 'vespa_parasitoide', 'vespa_predadora']
image_paths = []
labels = []

for category in categories:
    json_path = os.path.join(BASE_DIR, 'data', f'lista_{category}.json')
    with open(json_path, 'r') as f:
        data = json.load(f)
    for item in data:
        image_paths.append(os.path.join(BASE_DIR, item['image']))
        labels.append(category)

# Criar DataFrame
df = pd.DataFrame({'filename': image_paths, 'class': labels})

# Imprimir informações sobre o DataFrame para diagnóstico
print("Primeiras linhas do DataFrame:")
print(df.head())
print("\nContagem de classes:")
print(df['class'].value_counts())

# Dividir os dados em conjuntos de treino e teste
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['class'])

# Função para carregar e pré-processar imagens
def load_and_preprocess_image(path, label):
    image = tf.io.read_file(path)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.convert_image_dtype(image, tf.float32)
    image = tf.image.resize(image, [224, 224])
    return image, label

# Preparar os geradores de imagens
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    validation_split=0.2
)

test_datagen = ImageDataGenerator(rescale=1./255)

# Criar geradores de dados
train_generator = train_datagen.flow_from_dataframe(
    dataframe=train_df,
    x_col='filename',
    y_col='class',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='training'
)

validation_generator = train_datagen.flow_from_dataframe(
    dataframe=train_df,
    x_col='filename',
    y_col='class',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='validation'
)

test_generator = test_datagen.flow_from_dataframe(
    dataframe=test_df,
    x_col='filename',
    y_col='class',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    shuffle=False
)

# Criar e treinar o modelo
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(1024, activation='relu')(x)
output = Dense(len(categories), activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)

for layer in base_model.layers:
    layer.trainable = False

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Treinar o modelo
history = model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // train_generator.batch_size,
    validation_data=validation_generator,
    validation_steps=validation_generator.samples // validation_generator.batch_size,
    epochs=20
)

# Avaliar o modelo
test_loss, test_accuracy = model.evaluate(test_generator, steps=test_generator.samples // test_generator.batch_size)
print(f"Acurácia no conjunto de teste: {test_accuracy:.2f}")

# Salvar o modelo
model_path = os.path.join(BASE_DIR, 'backend', 'insect_classifier.h5')
model.save(model_path)
print(f"Modelo salvo em: {model_path}")

# Opcional: Plot do histórico de treinamento
import matplotlib.pyplot as plt

plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Treino')
plt.plot(history.history['val_accuracy'], label='Validação')
plt.title('Acurácia do Modelo')
plt.xlabel('Época')
plt.ylabel('Acurácia')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Treino')
plt.plot(history.history['val_loss'], label='Validação')
plt.title('Perda do Modelo')
plt.xlabel('Época')
plt.ylabel('Perda')
plt.legend()

plt.tight_layout()
plt.savefig(os.path.join(BASE_DIR, 'training_history.png'))
print("Gráfico do histórico de treinamento salvo.")