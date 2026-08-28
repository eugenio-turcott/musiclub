// src/pages/ProfilePage.jsx
import React from 'react';
import { UserProfile } from '../components/UserProfile';

export function ProfilePage() {
  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <UserProfile isPage={true} />
    </div>
  );
}

export default ProfilePage;

