// src/pages/RecommendationsPage.jsx
import React from 'react';
import { Recommendations } from '../components/Recommendations';

export function RecommendationsPage() {
  return (
    <div className="w-full min-h-screen px-2 py-3 sm:px-4 sm:py-6 max-w-7xl mx-auto">
      <Recommendations isPage={true} />
    </div>
  );
}

export default RecommendationsPage;
