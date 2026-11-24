-- LUX digital (2025): 15 tracks; Complete Works (2026): 18 tracks.
-- Verified: https://api.deezer.com/album/851013072 and /album/961635041
-- Sony: https://www.sonymusic.co.jp/artist/rosalia/info/582838
-- Preserves release/nominee IDs and does not merge distinct editions.
BEGIN;
DO $$
BEGIN
 PERFORM id FROM public.albums WHERE id IN ('64bb290f-0068-4d68-b9bf-130b831e9718'::uuid,'27f83e5e-4f6e-481d-9974-8f738d5e2f48'::uuid) FOR UPDATE;
 IF (SELECT count(*) FROM public.albums WHERE id IN ('64bb290f-0068-4d68-b9bf-130b831e9718'::uuid,'27f83e5e-4f6e-481d-9974-8f738d5e2f48'::uuid) AND artist_name='ROSALÍA' AND album_name IN ('LUX','LUX (Complete Works)')) <> 2 THEN
  RAISE EXCEPTION 'LUX identities changed; review the repair before applying';
 END IF;
 IF EXISTS (SELECT 1 FROM public.reviews WHERE album_id IN ('64bb290f-0068-4d68-b9bf-130b831e9718'::uuid,'27f83e5e-4f6e-481d-9974-8f738d5e2f48'::uuid)) THEN
  RAISE EXCEPTION 'Reviews now exist; verify track references before applying this repair';
 END IF;
END $$;
UPDATE public.albums SET image_url = 'https://cdn-images.dzcdn.net/images/cover/0dd6cd0e783f1505cd57778953ab77a1/1000x1000-000000-80-0-0.jpg',
 tracks = '[{"id":"3tkwOzZXgstU1DdH4gpaw1","name":"Sexo, Violencia y Llantas","track_number":1,"disc_number":1,"duration_ms":140000,"id_aliases":["deezer-3640140892"]},{"id":"7s2fbTm6mudP1SZDZR8vci","name":"Reliquia","track_number":2,"disc_number":1,"duration_ms":230000,"id_aliases":["deezer-3640140902"]},{"id":"5Doua6JQZzfRgxMW5RWJUB","name":"Divinize","track_number":3,"disc_number":1,"duration_ms":243000,"id_aliases":["deezer-3640140912"]},{"id":"0LdgA1zbSnRgM29DxxYcu8","name":"Porcelana","track_number":4,"disc_number":1,"duration_ms":248000,"id_aliases":["deezer-3640140922"]},{"id":"0zJxp7ndkNCwE2zjfmnnBZ","name":"Mio Cristo Piange Diamanti","track_number":5,"disc_number":1,"duration_ms":269000,"id_aliases":["deezer-3640140932"]},{"id":"6ZBJc582Szb5UGV3VDgrkh","name":"Berghain","track_number":6,"disc_number":1,"duration_ms":178000,"id_aliases":["deezer-3640140942"]},{"id":"3Vgk7dv0fpyHlyeTZatE31","name":"La Perla","track_number":7,"disc_number":1,"duration_ms":195000,"id_aliases":["deezer-3640140952"]},{"id":"1uRF6PMGde0D7uB73bni1d","name":"Mundo Nuevo","track_number":8,"disc_number":1,"duration_ms":140000,"id_aliases":["deezer-3640140962"]},{"id":"6F52Ls9K7a6vNNi0lip9Gm","name":"De Madrugá","track_number":9,"disc_number":1,"duration_ms":104000,"id_aliases":["deezer-3640140972"]},{"id":"deezer-3640140982","name":"Dios Es Un Stalker","track_number":10,"disc_number":1,"duration_ms":130000},{"id":"08g7n12xuTaZwcwr7dgWLR","name":"La Yugular","track_number":11,"disc_number":1,"duration_ms":258000,"id_aliases":["deezer-3640140992"]},{"id":"76HbQAib8rYB6fPaz57Xh6","name":"Sauvignon Blanc","track_number":12,"disc_number":1,"duration_ms":162000,"id_aliases":["deezer-3640141002"]},{"id":"3MTrgQB5BtBzbW7pUCHnUo","name":"La Rumba Del Perdón","track_number":13,"disc_number":1,"duration_ms":252000,"id_aliases":["deezer-3640141012"]},{"id":"6EeJk2HeGzKA24NDVYokaJ","name":"Memória","track_number":14,"disc_number":1,"duration_ms":225000,"id_aliases":["deezer-3640141022"]},{"id":"4cSEOMb21q2S2ypucBvQT0","name":"Magnolias","track_number":15,"disc_number":1,"duration_ms":194000,"id_aliases":["deezer-3640141032"]}]'::jsonb,
 total_tracks = 15,
 release_date = '2025-11-07',
 release_year = 2025,
 other_link = 'https://www.deezer.com/album/851013072',
 apple_music_link = 'https://music.apple.com/mx/album/lux/1848167516',
 spotify_link = NULL,
 spotify_verified = false
 WHERE id = '64bb290f-0068-4d68-b9bf-130b831e9718'::uuid AND album_name = 'LUX' AND artist_name = 'ROSALÍA';
UPDATE public.albums SET image_url = 'https://cdn-images.dzcdn.net/images/cover/dfd5a96d3e47a50989785a61a7a6fc7a/1000x1000-000000-80-0-0.jpg',
 tracks = '[{"id":"deezer-3961034441","name":"Sexo, Violencia y Llantas","track_number":1,"disc_number":1,"duration_ms":140000},{"id":"deezer-3961034451","name":"Reliquia","track_number":2,"disc_number":1,"duration_ms":229000},{"id":"deezer-3961034461","name":"Divinize","track_number":3,"disc_number":1,"duration_ms":243000},{"id":"deezer-3961034471","name":"Porcelana","track_number":4,"disc_number":1,"duration_ms":247000},{"id":"deezer-3961034481","name":"Mio Cristo Piange Diamanti","track_number":5,"disc_number":1,"duration_ms":269000},{"id":"deezer-3961034491","name":"Berghain","track_number":6,"disc_number":1,"duration_ms":178000},{"id":"deezer-3961034501","name":"La Perla","track_number":7,"disc_number":1,"duration_ms":195000},{"id":"deezer-3961034531","name":"Mundo Nuevo","track_number":8,"disc_number":1,"duration_ms":140000},{"id":"deezer-3961034541","name":"De Madrugá","track_number":9,"disc_number":1,"duration_ms":104000},{"id":"deezer-3961034551","name":"Dios Es Un Stalker (versión Francotiradora)","track_number":10,"disc_number":1,"duration_ms":177000},{"id":"deezer-3961034561","name":"La Yugular","track_number":11,"disc_number":1,"duration_ms":258000},{"id":"deezer-3961034571","name":"Focu ''Ranni","track_number":12,"disc_number":1,"duration_ms":170000},{"id":"deezer-3961034581","name":"Sauvignon Blanc","track_number":13,"disc_number":1,"duration_ms":162000},{"id":"deezer-3961034591","name":"Jeanne","track_number":14,"disc_number":1,"duration_ms":231000},{"id":"deezer-3961034601","name":"Novia Robot","track_number":15,"disc_number":1,"duration_ms":192000},{"id":"deezer-3961034611","name":"La Rumba Del Perdón","track_number":16,"disc_number":1,"duration_ms":251000},{"id":"deezer-3961034631","name":"Memória","track_number":17,"disc_number":1,"duration_ms":225000},{"id":"deezer-3961034641","name":"Magnolias","track_number":18,"disc_number":1,"duration_ms":194000}]'::jsonb,
 total_tracks = 18,
 release_date = '2026-04-16',
 release_year = 2026,
 other_link = 'https://www.deezer.com/album/961635041',
 apple_music_link = 'https://music.apple.com/mx/album/lux-complete-works/1893474283',
 spotify_link = 'https://open.spotify.com/album/3goLwu2fkSSmghikOcVufU',
 spotify_verified = true
 WHERE id = '27f83e5e-4f6e-481d-9974-8f738d5e2f48'::uuid AND album_name = 'LUX (Complete Works)' AND artist_name = 'ROSALÍA';
UPDATE public.record_club_releases SET total_tracks=15, image_url='https://cdn-images.dzcdn.net/images/cover/0dd6cd0e783f1505cd57778953ab77a1/1000x1000-000000-80-0-0.jpg' WHERE id='r5eokodzo6ml61n4' AND album_name='LUX' AND artist_name='ROSALÍA';
UPDATE public.grammy_nominees SET image_url='https://cdn-images.dzcdn.net/images/cover/dfd5a96d3e47a50989785a61a7a6fc7a/1000x1000-000000-80-0-0.jpg',spotify_url='https://open.spotify.com/album/3goLwu2fkSSmghikOcVufU',apple_music_url='https://music.apple.com/mx/album/lux-complete-works/1893474283',deezer_url='https://www.deezer.com/album/961635041' WHERE album_id='27f83e5e-4f6e-481d-9974-8f738d5e2f48'::uuid AND title='LUX (Complete Works)';
COMMIT;
