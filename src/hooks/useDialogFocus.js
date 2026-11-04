'use client';
import {useEffect,useRef} from 'react';
const scrollLocks=new Set();let originalOverflow='';
export function useDialogFocus(open,onClose) {
  const ref=useRef(null),close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement;
    const lock={};if(!scrollLocks.size)originalOverflow=document.body.style.overflow;scrollLocks.add(lock);
    document.body.style.overflow='hidden';
    const dialog=ref.current;
    dialog?.querySelector('button')?.focus();
    const key=event=>{
      const dialogs=[...document.querySelectorAll('[role="dialog"][aria-modal="true"]')];
      if(dialogs.at(-1)!==dialog)return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close.current?.();}
      if(event.key==='Tab'){
        const items=[...dialog.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')].filter(el=>el.getClientRects().length);
        const first=items[0],last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{scrollLocks.delete(lock);if(!scrollLocks.size)document.body.style.overflow=originalOverflow;document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};
  },[open]);
  return ref;
}
