// src/pages/RecommendationsPage.jsx
import React from 'react';
import { Recommendations } from '../components/Recommendations';

export function RecommendationsPage() {
  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <Recommendations isPage={true} />
    </div>
  );
}

export default RecommendationsPage;
