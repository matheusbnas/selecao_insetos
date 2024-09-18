import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Camera from 'react-html5-camera-photo';
import 'react-html5-camera-photo/build/css/index.css';
import './App.css';

function App() {
  const [view, setView] = useState('menu');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const species = [
    'aranhas', 'besouro_carabideo', 'crisopideo', 'joaninhas', 'libelulas',
    'mosca_asilidea', 'mosca_dolicopodidea', 'mosca_sirfidea', 'mosca_taquinidea',
    'percevejo_geocoris', 'percevejo_orius', 'percevejo_pentatomideo',
    'percevejo_reduviideo', 'tesourinha', 'vespa_parasitoide', 'vespa_predadora'
  ];

  useEffect(() => {
    if (selectedSpecies) {
      axios.get(`http://localhost:5000/images/${selectedSpecies}`)
        .then(response => {
          const fullUrls = response.data.map(imagePath => `http://localhost:5000${imagePath}`);
          setImages(fullUrls);
        })
        .catch(error => console.error('Error fetching images:', error));
    }
  }, [selectedSpecies]);

  const handleFileSelect = (event) => {
    classifyImage(event.target.files[0]);
  };

  const handleCameraCapture = (dataUri) => {
    fetch(dataUri)
      .then(res => res.blob())
      .then(blob => classifyImage(blob));
  };

  const classifyImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await axios.post('http://localhost:5000/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPrediction(response.data);
      setView('result');
    } catch (error) {
      console.error('Error classifying image:', error);
      alert('Error classifying image. Please try again.');
    }
  };

  const renderMenu = () => (
    <div className="menu">
      {species.map(s => (
        <div key={s} className="species-item" onClick={() => {setSelectedSpecies(s); setView('gallery');}}>
          <img src={`http://localhost:5000/galerias/${s}/botao_menu.jpg`} alt={s} />
          <p>{s.replace('_', ' ')}</p>
        </div>
      ))}
    </div>
  );

  const renderGallery = () => (
    <div className="gallery">
      <h2>{selectedSpecies.replace('_', ' ')} Gallery</h2>
      {images.length > 0 ? (
        <div>
          <img src={images[currentImageIndex]} alt={selectedSpecies} />
          <div>
            <button onClick={() => setCurrentImageIndex(i => (i > 0 ? i - 1 : images.length - 1))}>Previous</button>
            <button onClick={() => setCurrentImageIndex(i => (i < images.length - 1 ? i + 1 : 0))}>Next</button>
          </div>
          <p>Image {currentImageIndex + 1} of {images.length}</p>
        </div>
      ) : (
        <p>No images available for this species.</p>
      )}
    </div>
  );

  const renderCamera = () => (
    <div className="camera">
      <Camera onTakePhoto={handleCameraCapture} />
    </div>
  );

  const renderResult = () => (
    <div className="result">
      <h2>Prediction Result:</h2>
      <p>Class: {prediction.predicted_class}</p>
      <p>Confidence: {(prediction.confidence * 100).toFixed(2)}%</p>
    </div>
  );

  return (
    <div className="App">
      <header>
        <h1>Insect Classifier</h1>
      </header>
      <main>
        {view === 'menu' && renderMenu()}
        {view === 'gallery' && renderGallery()}
        {view === 'camera' && renderCamera()}
        {view === 'result' && renderResult()}
      </main>
      <footer>
        <button onClick={() => setView('menu')}>Menu</button>
        <button onClick={() => setView('camera')}>Capture Photo</button>
        <input type="file" onChange={handleFileSelect} accept="image/*" />
      </footer>
    </div>
  );
}

export default App;