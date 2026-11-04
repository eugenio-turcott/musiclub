'use client';
import dynamic from 'next/dynamic';
import {useAuth} from '../hooks/useAuth';
const Studio=dynamic(()=>import('./ShareStudio').then(module=>module.ShareStudio),{ssr:false});
export function ShareProfileModal({isOpen,onClose,profile}){const {user}=useAuth();return isOpen&&user?.id&&profile?.id===user.id?<Studio isOpen onClose={onClose} kind="profile" profile={profile}/>:null;}
