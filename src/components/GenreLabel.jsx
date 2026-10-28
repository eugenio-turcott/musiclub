'use client';
import React from 'react';
import { InterfaceText } from './UiIcon';
import { Link } from 'react-router-dom';
import { GenreArtwork } from './GenreArtwork';
import catalog from '../utils/genreCatalog.cjs';
import routes from '../utils/genreRoutes.cjs';

export function GenreLabel({ genre, size = 20, link = false, className = '', fallbackIcon = '' }) {
  const names = catalog.normalizeGenres([genre]);
  const label = names.length === 1 ? names[0] : String(genre || '');
  const content = <>{!names.length && fallbackIcon && <span aria-hidden="true"><InterfaceText>{fallbackIcon}</InterfaceText></span>}{names.map(name => <GenreArtwork key={name} genre={name} size={size} className="shrink-0" />)}<span translate="no" className="min-w-0 truncate">{label}</span></>;
  const classes = `inline-flex min-w-0 max-w-full items-center gap-1.5 align-middle ${className}`;
  return link && names.length === 1 ? <Link to={routes.genrePath(names[0])} className={classes}>{content}</Link> : <span className={classes}>{content}</span>;
}
