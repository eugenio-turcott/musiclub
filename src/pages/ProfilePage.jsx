// src/pages/ProfilePage.jsx
import React from 'react';
import { UserProfile } from '../components/UserProfile';

export function ProfilePage() {
  return (
    <div className="w-full min-h-screen px-2 py-3 sm:px-4 sm:py-6 max-w-7xl mx-auto">
      <UserProfile isPage={true} />
    </div>
  );
}

export default ProfilePage;

