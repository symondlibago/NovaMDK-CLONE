import React from 'react';
import Home from '../components/Home';
import Seo from '../components/Seo';
import { Toaster } from '../components/ui/toaster';

const Platform = () => {
  return (
    <div className="min-h-screen bg-white">
      <Seo
        path="/"
        description="NovaMDK — personalized supplements and treatments, prescribed online. Dedicated online care, a physician's protocol, delivered fast to your door."
      />
      <Home />
      <Toaster />
    </div>
  );
};

export default Platform;