// src/pages/SettingsPage.jsx
import React from 'react';
import { UserSettings } from '../components/UserSettings';

export function SettingsPage() {
  return (
    <div className="min-h-screen cyber-grid p-4 sm:p-6">
      <UserSettings />
    </div>
  );
}

export default SettingsPage;
