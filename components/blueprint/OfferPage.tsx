import React from 'react';
import { useParams } from 'react-router-dom';

const OfferPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Offer Page - {slug}</h1>
    </div>
  );
};

export default OfferPage;
