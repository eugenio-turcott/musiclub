'use client';
import {ShareStudio} from './ShareStudio';
import {useAuth} from '../hooks/useAuth';
export default function ShareTierListModal({isOpen,onClose,user,tierGroups}){const auth=useAuth();return auth.user?.id&&auth.user.id===user?.id?<ShareStudio isOpen={isOpen} onClose={onClose} kind="tierlist" profile={user} tierGroups={tierGroups||{}}/>:null;}
