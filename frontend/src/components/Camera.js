import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const Camera = ({ setResult }) => {
  const webcamRef = useRef(null);

  const captureImage = React.useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    try {
      const response = await axios.post('http://localhost:5000/identify', { image: imageSrc });
      setResult(response.data);
    } catch (error) {
      console.error('Error identifying insect:', error);
    }
  }, [webcamRef, setResult]);

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
      />
      <button onClick={captureImage}>Capturar e Identificar</button>
    </div>
  );
};

export default Camera;