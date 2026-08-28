// src/pages/SettingsPage.jsx
import React from 'react';
import { UserSettings } from '../components/UserSettings';

export function SettingsPage() {
  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <UserSettings />
    </div>
  );
}

export default SettingsPage;
