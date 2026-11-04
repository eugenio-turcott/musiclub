'use client';
import dynamic from 'next/dynamic';
const Studio=dynamic(()=>import('./ShareStudio').then(module=>module.ShareStudio),{ssr:false});
export function ShareProfileModal({isOpen,onClose,profile}){return isOpen?<Studio isOpen onClose={onClose} kind="profile" profile={profile}/>:null;}
