import React from 'react';

const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-24">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Miracle
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-loose">
            Your pharmaceutical intelligence platform. Get insights, track progress, and make data-driven decisions to accelerate drug development and improve patient outcomes.
          </p>
      </div>
    </div>
  );
};

export default WelcomePage;