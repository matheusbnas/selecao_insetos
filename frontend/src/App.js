import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Camera from 'react-html5-camera-photo';
import 'react-html5-camera-photo/build/css/index.css';
import './App.css';
import HomePage from './components/HomePage';
import { auth } from './Firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const languages = {
  pt: {
    title: 'Classificador de Insetos',
    menu: 'Menu',
    capture: 'Capturar',
    upload: 'Carregar',
    gallery: 'Galeria',
    previous: 'Anterior',
    next: 'Próximo',
    noImages: 'Nenhuma imagem disponível para esta espécie.',
    predictionResult: 'Resultado da Previsão:',
    class: 'Classe:',
    confidence: 'Confiança:',
    exit: 'Sair'
  },
  en: {
    title: 'Insect Classifier',
    menu: 'Menu',
    capture: 'Capture',
    upload: 'Upload',
    gallery: 'Gallery',
    previous: 'Previous',
    next: 'Next',
    noImages: 'No images available for this species.',
    predictionResult: 'Prediction Result:',
    class: 'Class:',
    confidence: 'Confidence:',
    exit: 'Exit'
  }
};

function App() {
  const [view, setView] = useState('home');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [language, setLanguage] = useState('pt');
  const [user, setUser] = useState(null);

  const species = [
    'aranhas', 'besouro_carabideo', 'crisopideo', 'joaninhas', 'libelulas',
    'mosca_asilidea', 'mosca_dolicopodidea', 'mosca_sirfidea', 'mosca_taquinidea',
    'percevejo_geocoris', 'percevejo_orius', 'percevejo_pentatomideo',
    'percevejo_reduviideo', 'tesourinha', 'vespa_parasitoide', 'vespa_predadora'
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

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

  const signIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .catch((error) => console.error('Error signing in with Google', error));
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setView('home');
      setSelectedSpecies(null);
      setPrediction(null);
      setCapturedImage(null);
    }).catch((error) => console.error('Error signing out', error));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setCapturedImage(URL.createObjectURL(file));
    classifyImage(file);
  };

  const handleCameraCapture = (dataUri) => {
    setCapturedImage(dataUri);
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

  const renderHomePage = () => (
    <HomePage onEnter={user ? () => setView('menu') : signIn} language={language} user={user} />
  );

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
      <h2>{selectedSpecies.replace('_', ' ')} {languages[language].gallery}</h2>
      {images.length > 0 ? (
        <div className="gallery-content">
          <img src={images[currentImageIndex]} alt={selectedSpecies} />
          <div className="gallery-controls">
            <button onClick={() => setCurrentImageIndex(i => (i > 0 ? i - 1 : images.length - 1))}>
              <i className="fas fa-chevron-left"></i> {languages[language].previous}
            </button>
            <p>{languages[language].gallery} {currentImageIndex + 1} / {images.length}</p>
            <button onClick={() => setCurrentImageIndex(i => (i < images.length - 1 ? i + 1 : 0))}>
              {languages[language].next} <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      ) : (
        <p>{languages[language].noImages}</p>
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
      <h2>{languages[language].predictionResult}</h2>
      {capturedImage && (
        <img src={capturedImage} alt="Captured" className="captured-image" />
      )}
      <p>{languages[language].class} {prediction.predicted_class}</p>
      <p>{languages[language].confidence} {(prediction.confidence * 100).toFixed(2)}%</p>
    </div>
  );

  return (
    <div className="App">
      <header>
        <h1>{languages[language].title}</h1>
        <select onChange={(e) => setLanguage(e.target.value)} value={language}>
          <option value="pt">Português</option>
          <option value="en">English</option>
        </select>
      </header>
      <main>
        {!user && view !== 'home' ? renderHomePage() : (
          <>
            {view === 'home' && renderHomePage()}
            {view === 'menu' && renderMenu()}
            {view === 'gallery' && renderGallery()}
            {view === 'camera' && renderCamera()}
            {view === 'result' && renderResult()}
          </>
        )}
      </main>
      {view !== 'home' && user && (
        <nav>
          <button onClick={() => setView('menu')}>
            <i className="fas fa-home"></i>
            {languages[language].menu}
          </button>
          <button onClick={() => setView('camera')}>
            <i className="fas fa-camera"></i>
            {languages[language].capture}
          </button>
          <label className="file-input">
            <input type="file" onChange={handleFileSelect} accept="image/*" />
            <i className="fas fa-upload"></i>
            {languages[language].upload}
          </label>
          <button onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {languages[language].exit}
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;