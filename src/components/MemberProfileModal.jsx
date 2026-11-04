'use client';
import {useState} from 'react';
import {createPortal} from 'react-dom';
import {UserProfile} from './UserProfile';
import {UiIcon} from './UiIcon';
import {useDialogFocus} from '../hooks/useDialogFocus';
import {SendSongRecommendationModal} from './SendSongRecommendationModal';

export function MemberProfileModal({isOpen,onClose,user:memberUser,currentUser}) {
  const [recommend,setRecommend]=useState(false);
  const ref=useDialogFocus(isOpen,onClose);
  if(!isOpen||!memberUser)return null;
  return createPortal(<div className="member-profile-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section ref={ref} role="dialog" aria-modal="true" aria-label={`Perfil de ${memberUser.name || 'miembro'}`} className="member-profile-dialog">
      <div className="member-profile-toolbar"><span>El club, persona por persona</span><button type="button" aria-label="Cerrar perfil de miembro" onClick={onClose}><UiIcon name="close" tone="inherit"/>Cerrar</button></div>
      <UserProfile key={memberUser.id} memberUser={memberUser} memberActions={currentUser&&currentUser.id!==memberUser.id?<button type="button" className="account-primary-action" onClick={()=>setRecommend(true)}><UiIcon name="mailbox" tone="inherit"/>Recomendar Canción</button>:null}/>
    </section>
    {recommend&&<SendSongRecommendationModal isOpen currentUser={currentUser} defaultRecipient={memberUser} onClose={()=>setRecommend(false)}/>}
  </div>,document.body);
}
