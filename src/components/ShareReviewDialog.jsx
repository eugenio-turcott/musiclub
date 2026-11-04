'use client';
import {ShareStudio} from './ShareStudio';
import {renderSocialCard,loadCardImage,SHARE_THEMES} from '../utils/socialCards';
export const THEMES=SHARE_THEMES;
export const preloadCORSImage=loadCardImage;
export const formatDisplayScore=score=>score==null?'—':Number(score).toFixed(1).replace(/\.0$/,'');
export function generateReviewStoryCanvas({review,album,currentUser,themeId='neon',format='story'}){return renderSocialCard({review,album,profile:currentUser||{},theme:themeId,format});}
export function ShareReviewModal({isOpen,onClose,review,album,currentUser}){
  return <ShareStudio isOpen={isOpen} onClose={onClose} review={review||{}} album={album||review?.album||review?.albums||{}} profile={currentUser||{}}/>;
}
export default ShareReviewModal;
