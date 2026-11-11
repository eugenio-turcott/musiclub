begin;
create table public.grammy_events(
 id text primary key, status text not null default 'preparing' check(status in('preparing','open','closed')),
 nominations_at timestamptz not null, closes_at timestamptz not null, published_at timestamptz, source_url text
);
insert into public.grammy_events(id,nominations_at,closes_at) values('grammys-2027','2026-11-16 12:45:00+00','2027-02-07 20:00:00+00');
create table public.grammy_categories(id text primary key,field_id text not null,name text not null);
insert into public.grammy_categories(id,field_id,name) values
('record-of-the-year','general','Grabación del año'),
('album-of-the-year','general','Álbum del año'),
('song-of-the-year','general','Canción del año'),
('best-new-artist','general','Mejor artista nuevo'),
('producer-of-the-year-non-classical','general','Productor del año, no clásico'),
('songwriter-of-the-year-non-classical','general','Compositor del año, no clásico'),
('best-pop-solo-performance','pop','Mejor interpretación pop solista'),
('best-pop-duo-group-performance','pop','Mejor interpretación pop de dúo o grupo'),
('best-asian-pop-music-performance','pop','Mejor interpretación de música pop asiática'),
('best-pop-vocal-album','pop','Mejor álbum de pop vocal'),
('best-dance-electronic-album','pop','Mejor álbum de música dance/electrónica'),
('best-dance-pop-recording','pop','Mejor grabación dance pop'),
('best-dance-electronic-recording','pop','Mejor grabación dance/electrónica'),
('best-remixed-recording-non-classical','pop','Mejor grabación remezclada, no clásica'),
('best-rock-performance','rock','Mejor interpretación de rock'),
('best-metal-performance','rock','Mejor interpretación de metal'),
('best-rock-song','rock','Mejor canción de rock'),
('best-rock-album','rock','Mejor álbum de rock'),
('best-alternative-music-performance','rock','Mejor interpretación de música alternativa'),
('best-alternative-music-album','rock','Mejor álbum de música alternativa'),
('best-r-b-solo-performance','rb','Mejor interpretación solista de R&B'),
('best-traditional-r-b-performance','rb','Mejor interpretación de R&B tradicional'),
('best-r-b-collaboration-or-duo-group-performance','rb','Mejor colaboración o interpretación de dúo o grupo de R&B'),
('best-r-b-song','rb','Mejor canción de R&B'),
('best-r-b-album','rb','Mejor álbum de R&B'),
('best-progressive-r-b-album','rb','Mejor álbum de R&B progresivo'),
('best-rap-performance','rb','Mejor interpretación de rap'),
('best-melodic-rap-performance','rb','Mejor interpretación de rap melódico'),
('best-rap-song','rb','Mejor canción de rap'),
('best-rap-album','rb','Mejor álbum de rap'),
('best-spoken-word-poetry-album','rb','Mejor álbum de poesía hablada'),
('best-jazz-performance','jazz','Mejor interpretación de jazz'),
('best-jazz-vocal-album','jazz','Mejor álbum de jazz vocal'),
('best-jazz-instrumental-album','jazz','Mejor álbum de jazz instrumental'),
('best-large-jazz-ensemble-album','jazz','Mejor álbum de gran ensamble de jazz'),
('best-latin-jazz-album','jazz','Mejor álbum de jazz latino'),
('best-alternative-jazz-album','jazz','Mejor álbum de jazz alternativo'),
('best-traditional-pop-vocal-album','jazz','Mejor álbum de pop vocal tradicional'),
('best-traditional-pop-vocal-performance','jazz','Mejor interpretación vocal de pop tradicional'),
('best-contemporary-instrumental-album','jazz','Mejor álbum instrumental contemporáneo'),
('best-musical-theater-album','jazz','Mejor álbum de teatro musical'),
('best-country-solo-performance','country','Mejor interpretación country solista'),
('best-country-duo-group-performance','country','Mejor interpretación country de dúo o grupo'),
('best-contemporary-country-album','country','Mejor álbum country contemporáneo'),
('best-traditional-country-album','country','Mejor álbum country tradicional'),
('best-country-song','country','Mejor canción country'),
('best-american-roots-song','country','Mejor canción de raíces americanas'),
('best-american-roots-performance','country','Mejor interpretación de raíces americanas'),
('best-americana-performance','country','Mejor interpretación americana'),
('best-americana-album','country','Mejor álbum americana'),
('best-bluegrass-album','country','Mejor álbum de bluegrass'),
('best-traditional-blues-album','country','Mejor álbum de blues tradicional'),
('best-contemporary-blues-album','country','Mejor álbum de blues contemporáneo'),
('best-traditional-folk-album','country','Mejor álbum de música folclórica tradicional'),
('best-contemporary-folk-album','country','Mejor álbum folk contemporáneo'),
('best-regional-roots-music-album','country','Mejor álbum de música de raíces regionales'),
('best-gospel-performance-song','gospel','Mejor interpretación/canción góspel'),
('best-contemporary-christian-music-performance-song','gospel','Mejor interpretación/canción de música cristiana contemporánea'),
('best-gospel-album','gospel','Mejor álbum góspel'),
('best-contemporary-christian-music-album','gospel','Mejor álbum de música cristiana contemporánea'),
('best-roots-gospel-album','gospel','Mejor álbum de góspel de raíces'),
('best-latin-pop-album','global','Mejor álbum de pop latino'),
('best-m-sica-urbana-album','global','Mejor álbum de música urbana'),
('best-latin-rock-or-alternative-album','global','Mejor álbum de rock latino o alternativo'),
('best-m-sica-mexicana-album-including-tejano','global','Mejor álbum de música mexicana (incluyendo tejano)'),
('best-tropical-latin-album','global','Mejor álbum latino tropical'),
('best-latin-song','global','Mejor canción latina'),
('best-reggae-album','global','Mejor álbum de reggae'),
('best-global-music-performance','global','Mejor interpretación de música global'),
('best-global-music-album','global','Mejor álbum de música global'),
('best-african-music-performance','global','Mejor interpretación de música africana'),
('best-new-age-ambient-or-chant-album','global','Mejor álbum de new age, ambient o canto'),
('best-children-s-album','visual','Mejor álbum infantil'),
('best-comedy-album','visual','Mejor álbum de comedia'),
('best-audio-book-narration-storytelling-recording','visual','Mejor grabación de audiolibro, narración y narración de cuentos'),
('best-compilation-soundtrack-for-visual-media','visual','Mejor banda sonora recopilatoria para medios visuales'),
('best-score-soundtrack-album-for-visual-media','visual','Mejor banda sonora original para medios visuales'),
('best-score-soundtrack-for-video-games-and-other-interactive-media','visual','Mejor banda sonora original para videojuegos y otros medios interactivos'),
('best-song-written-for-visual-media','visual','Mejor canción escrita para medios visuales'),
('best-music-video','visual','Mejor video musical'),
('best-music-film','visual','Mejor película musical'),
('best-historical-album','art','Mejor álbum histórico'),
('best-recording-package','art','Mejor diseño de empaque'),
('best-album-cover','art','Mejor portada de álbum'),
('best-album-notes','art','Mejores notas de álbum'),
('producer-of-the-year-classical','production','Productor del año, clásico'),
('best-immersive-audio-album','production','Mejor álbum de audio inmersivo'),
('best-instrumental-composition','production','Mejor composición instrumental'),
('best-engineered-album-classical','production','Mejor ingeniería de álbum, clásico'),
('best-engineered-album-non-classical','production','Mejor ingeniería de álbum, no clásico'),
('best-arrangement-instrumental-or-a-cappella','production','Mejor arreglo, instrumental o a capela'),
('best-arrangement-instrumental-and-vocals','production','Mejor arreglo, instrumental y vocal'),
('best-orchestral-performance','classical','Mejor interpretación orquestal'),
('best-opera-recording','classical','Mejor grabación de ópera'),
('best-choral-performance','classical','Mejor interpretación coral'),
('best-chamber-music-small-ensemble-performance','classical','Mejor interpretación de música de cámara o pequeño ensamble'),
('best-classical-instrumental-solo','classical','Mejor solo instrumental clásico'),
('best-classical-vocal-solo','classical','Mejor solo vocal clásico'),
('best-classical-compendium','classical','Mejor compendio clásico'),
('best-contemporary-classical-composition','classical','Mejor composición clásica contemporánea');
create table public.grammy_nominees(
 id uuid primary key, event_id text not null references public.grammy_events(id),category_id text not null references public.grammy_categories(id),
 title text not null check(length(title) between 1 and 300),artist text not null default '' check(length(artist)<=500),image_url text,
 album_id uuid references public.albums(id) on delete set null,spotify_url text,apple_music_url text,youtube_url text,deezer_url text,
 unique(event_id,category_id,id)
);
create index grammy_nominees_event on public.grammy_nominees(event_id,category_id);
create table public.grammy_predictions(
 user_id uuid not null references auth.users(id) on delete cascade,event_id text not null,category_id text not null,nominee_id uuid not null,updated_at timestamptz not null default now(),
 primary key(user_id,event_id,category_id),foreign key(event_id,category_id,nominee_id) references public.grammy_nominees(event_id,category_id,id)
);
create table public.grammy_subscriptions(
 user_id uuid not null references auth.users(id) on delete cascade,event_id text not null references public.grammy_events(id),email text not null,
 enabled boolean not null default true,created_at timestamptz not null default now(),reminder_sent_at timestamptz,nominations_sent_at timestamptz,
 primary key(user_id,event_id)
);
alter table public.grammy_events enable row level security;
alter table public.grammy_categories enable row level security;
alter table public.grammy_nominees enable row level security;
alter table public.grammy_predictions enable row level security;
alter table public.grammy_subscriptions enable row level security;
revoke all on public.grammy_events,public.grammy_categories,public.grammy_nominees,public.grammy_predictions,public.grammy_subscriptions from anon,authenticated;
grant select on public.grammy_events,public.grammy_categories,public.grammy_nominees to anon,authenticated;
grant select on public.grammy_predictions,public.grammy_subscriptions to authenticated;
grant all on public.grammy_events,public.grammy_categories,public.grammy_nominees,public.grammy_predictions,public.grammy_subscriptions to service_role;
create policy grammy_event_read on public.grammy_events for select using(true);
create policy grammy_category_read on public.grammy_categories for select using(true);
create policy grammy_nominee_read on public.grammy_nominees for select using(exists(select 1 from public.grammy_events e where e.id=event_id and e.published_at is not null and e.status<>'preparing' and now()>=e.nominations_at));
create policy grammy_prediction_own on public.grammy_predictions for select to authenticated using(user_id=auth.uid());
create policy grammy_subscription_own on public.grammy_subscriptions for select to authenticated using(user_id=auth.uid());

create function public.musiclub_grammy_subscribe(p_enabled boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_email text:=lower(auth.jwt()->>'email');
begin
 if v_user is null or v_email is null or position('@' in v_email)=0 then raise exception 'Inicia sesión con un correo válido';end if;
 if now()>=(select closes_at from public.grammy_events where id='grammys-2027') then raise exception 'La actividad ha terminado';end if;
 insert into public.grammy_subscriptions(user_id,event_id,email,enabled) values(v_user,'grammys-2027',v_email,p_enabled)
 on conflict(user_id,event_id) do update set enabled=excluded.enabled,email=excluded.email;
 return p_enabled;
end $$;
create function public.musiclub_grammy_predict(p_category text,p_nominee uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Inicia sesión para predecir';end if;
 if not exists(select 1 from public.grammy_events where id='grammys-2027' and status='open' and published_at is not null and now()>=nominations_at and now()<closes_at) then raise exception 'Las predicciones no están abiertas';end if;
 if p_nominee is null then delete from public.grammy_predictions where user_id=auth.uid() and event_id='grammys-2027' and category_id=p_category;return;end if;
 if not exists(select 1 from public.grammy_nominees where id=p_nominee and event_id='grammys-2027' and category_id=p_category) then raise exception 'El nominado no pertenece a esta categoría';end if;
 insert into public.grammy_predictions(user_id,event_id,category_id,nominee_id) values(auth.uid(),'grammys-2027',p_category,p_nominee)
 on conflict(user_id,event_id,category_id) do update set nominee_id=excluded.nominee_id,updated_at=now();
end $$;
revoke all on function public.musiclub_grammy_subscribe(boolean),public.musiclub_grammy_predict(text,uuid) from public,anon;
grant execute on function public.musiclub_grammy_subscribe(boolean),public.musiclub_grammy_predict(text,uuid) to authenticated;
create function public.musiclub_pending_grammy_notices(p_phase text) returns table(user_id uuid,email text)
language sql security definer set search_path='' as $$
 select s.user_id,s.email from public.grammy_subscriptions s
 where s.event_id='grammys-2027' and s.enabled
 and ((p_phase='reminder' and s.reminder_sent_at is null and s.created_at<'2026-11-16 12:45:00+00') or (p_phase='nominations' and s.nominations_sent_at is null))
 and not exists(select 1 from public.musiclub_notification_deliveries d where d.delivery_key='grammys:2027:'||p_phase||':'||s.user_id::text)
 order by s.created_at limit 50
$$;
revoke all on function public.musiclub_pending_grammy_notices(text) from public,anon,authenticated;
grant execute on function public.musiclub_pending_grammy_notices(text) to service_role;
notify pgrst,'reload schema';
commit;
