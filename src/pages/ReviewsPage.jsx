// src/pages/ReviewsPage.jsx
import React from 'react';
import { Reviews as ReviewsComponent } from '../components/Reviews';

export function ReviewsPage() {
  return <ReviewsComponent isPage={true} onClose={() => {}} />;
}
