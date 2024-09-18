import React from 'react';

const SpeciesResult = ({ result }) => {
  return (
    <div>
      <h2>Resultado da Identificação</h2>
      <p>Espécie: {result.species}</p>
      <p>Confiança: {result.confidence}%</p>
    </div>
  );
};

export default SpeciesResult;