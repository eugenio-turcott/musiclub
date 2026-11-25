alter table public.albums add column if not exists dominant_colors text[] not null default '{}';
alter table public.albums add column if not exists palette_image_url text;
alter table public.artist_discographies add column if not exists dominant_colors text[] not null default '{}';
alter table public.artist_discographies add column if not exists palette_image_url text;
alter table public.albums add constraint albums_palette_hex check(cardinality(dominant_colors)<=5 and array_position(dominant_colors,null) is null and (cardinality(dominant_colors)=0 or array_to_string(dominant_colors,',') ~ '^(#[0-9a-fA-F]{6})(,#[0-9a-fA-F]{6}){0,4}$'));
alter table public.artist_discographies add constraint artist_palette_hex check(cardinality(dominant_colors)<=5 and array_position(dominant_colors,null) is null and (cardinality(dominant_colors)=0 or array_to_string(dominant_colors,',') ~ '^(#[0-9a-fA-F]{6})(,#[0-9a-fA-F]{6}){0,4}$'));
