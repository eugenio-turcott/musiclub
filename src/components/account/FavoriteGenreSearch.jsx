'use client';
import { useId, useMemo, useState } from 'react';
import catalog from '../../utils/genreCatalog.cjs';
import { GenreLabel } from '../GenreLabel';
import { UiIcon } from '../UiIcon';

const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Split the old combined choices, without deleting an unrecognized older favorite.
export function individualFavoriteGenres(values = []) {
  return [...new Set(values.filter(value => typeof value === 'string').flatMap(value => {
    const names = catalog.normalizeGenres([value], catalog.GENRES.length);
    return names.length ? names : [value];
  }))];
}

export function FavoriteGenreSearch({ selected, onAdd }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = useMemo(() => {
    const search = fold(query);
    if (!search) return [];
    const selectedIds = new Set(selected.map(catalog.genreKey));
    const exact = catalog.genreKey(query);
    const rank = genre => genre.id === exact ? 0 : fold(genre.name).startsWith(search) ? 1 : 2;
    return catalog.GENRES.filter(genre => !selectedIds.has(genre.id) &&
      (genre.id === exact || fold(`${genre.name} ${genre.id}`).includes(search)))
      .sort((a,b) => rank(a) - rank(b)).slice(0,12);
  }, [query, selected]);
  const expanded = open && !!query.trim();
  const add = genre => {
    onAdd(genre.name);
    setQuery(''); setActive(0); setOpen(false);
  };
  return <div className="favorite-genre-search" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <label htmlFor={`${id}-input`}>¿Falta alguno?</label>
    <div className="favorite-genre-search-input"><UiIcon name="search" tone="inherit"/>
      <input id={`${id}-input`} role="combobox" aria-autocomplete="list" aria-expanded={expanded}
        aria-controls={`${id}-results`} aria-activedescendant={expanded && matches[active] ? `${id}-option-${active}` : undefined}
        aria-describedby={`${id}-help`} value={query} autoComplete="off" placeholder="Buscar en los géneros de Musiclub"
        onFocus={() => setOpen(true)} onChange={event => {setQuery(event.target.value); setActive(0); setOpen(true);}}
        onKeyDown={event => {
          if (event.key === 'Escape') {event.preventDefault(); setOpen(false);}
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); setOpen(true);
            setActive(index => matches.length ? (index + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length : 0);
          }
          if (event.key === 'Enter') {event.preventDefault(); if (expanded && matches[active]) add(matches[active]);}
        }}/>
    </div>
    {expanded && <div className="favorite-genre-results">
      <ul id={`${id}-results`} role="listbox" aria-label="Géneros de Musiclub">
        {matches.map((genre,index) => <li key={genre.id} role="presentation"><button type="button"
          id={`${id}-option-${index}`} role="option" aria-selected={index === active} tabIndex={-1}
          onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => add(genre)}>
          <GenreLabel genre={genre.name} size={22}/><UiIcon name="plus" tone="inherit"/>
        </button></li>)}
      </ul>
      {!matches.length && <p role="status">No hay géneros disponibles con ese nombre. Prueba otra búsqueda; los que ya elegiste no se repiten.</p>}
    </div>}
    <p id={`${id}-help`} className="settings-field-help">Busca un género o subgénero existente y selecciónalo para añadirlo a tus favoritos.</p>
  </div>;
}
