import React from 'react';

function HomePage({ onEnter, language }) {
  const content = {
    pt: {
      title: "Galeria de Insetos Inimigos Naturais de Pragas Agrícolas",
      subtitle: "Conheça os Heróis Microscópicos da Agricultura",
      description: "Descubra o fascinante mundo dos insetos benéficos que ajudam a controlar pragas agrícolas de forma natural e sustentável.",
      features: [
        "Explore uma vasta galeria de imagens de insetos benéficos",
        "Aprenda sobre o papel crucial destes insetos no controle biológico",
        "Use nossa ferramenta de IA para identificar insetos em suas próprias fotos",
        "Contribua para práticas agrícolas mais sustentáveis"
      ],
      enterButton: "Entrar na Galeria"
    },
    en: {
      title: "Gallery of Natural Enemy Insects of Agricultural Pests",
      subtitle: "Meet the Microscopic Heroes of Agriculture",
      description: "Discover the fascinating world of beneficial insects that help control agricultural pests naturally and sustainably.",
      features: [
        "Explore a vast gallery of beneficial insect images",
        "Learn about the crucial role of these insects in biological control",
        "Use our AI tool to identify insects in your own photos",
        "Contribute to more sustainable agricultural practices"
      ],
      enterButton: "Enter Gallery"
    }
  };

  const { title, subtitle, description, features, enterButton } = content[language];

  return (
    <div className="home-page">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
      <p>{description}</p>
      <ul>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <button onClick={onEnter}>{enterButton}</button>
    </div>
  );
}

export default HomePage;