-- ==============================================================================
-- ACTUALIZACIÓN DE TRACK_RATINGS (REEMPLAZO DE SPOTIFY IDs POR NOMBRES DE CANCIÓN)
-- ==============================================================================

-- Eugenio: KAROL G - NO ME ARREPIENTO DE SENTIR TANTO
UPDATE reviews SET track_ratings = '{"MATADORA": 10, "Te llevas To": 9, "For u My lova": 9, "Alguien que te amaba": 10, "Después de ti": 10, "Still": 10, "Bebiendo Lágrimas": 8, "Maybe": 8, "Final feliz": 9, "BbY WOW": 10, "Con quién andará?": 8, "Eclipse": 9, "Ahí": 6, "Si lo ven": 8}'::jsonb WHERE id = '70b0b6d1-7cf4-4ec1-8059-6462bb464723';

-- Abel: Harry Styles - Fine Line
UPDATE reviews SET track_ratings = '{"Treat People With Kindness": 9, "Falling": 8, "Cherry": 6, "Adore You": 6, "Golden": 6, "Lights Up": 7, "Canyon Moon": 7, "To Be So Lonely": 6, "She": 6, "Watermelon Sugar": 7, "Fine Line": 6, "Sunflower, Vol. 6": 6}'::jsonb WHERE id = 'bbe09cee-d27d-43a8-8e31-b93c28eb3f4c';

-- Abel: Selena - Amor Prohibido
UPDATE reviews SET track_ratings = '{"Cobarde - Remasterizado 2024/30th Anniversary": 7, "Tus Desprecios - Remasterizado 2024/30th Anniversary": 6, "Bidi Bidi Bom Bom - Remasterizado 2024/30th Anniversary": 8, "Ya No - Remasterizado 2024/30th Anniversary": 8, "Fotos Y Recuerdos - Remasterizado 2024/30th Anniversary": 5, "Amor Prohibido - Remasterizado 2024/30th Anniversary": 9, "Si Una Vez - Remasterizado 2024/30th Anniversary": 6, "El Chico Del Apartamento 512 - Remasterizado 2024/30th Anniversary": 8, "Techno Cumbia - Remasterizado 2024/30th Anniversary": 8, "No Me Queda Más - Remasterizado 2024/30th Anniversary": 7}'::jsonb WHERE id = 'ae68723a-25b1-48b7-9ebe-8f4f200de4d9';

-- Eugenio: Rochelle Jordan - Through The Wall
UPDATE reviews SET track_ratings = '{"Doing It Too": 10, "Close 2 Me": 10, "Sweet Sensation": 9, "On 2 Something": 10, "Words 2 Say": 10, "Never Enough": 10, "Sum": 10, "Around": 10, "Grace": 10, "Ladida": 10, "I''m Your Muse": 9, "Get It Off": 9, "TTW": 9, "Bite The Bait": 10, "The Boy": 9, "Eyes Shut": 9, "Crave": 10}'::jsonb WHERE id = '7edf305a-5d4a-43dc-b56a-400e29ec29a4';

-- Eugenio: BENEE - Lychee
UPDATE reviews SET track_ratings = '{"Hurt You, Gus": 10, "Doesn''t Matter": 10, "Marry Myself": 10, "Soft Side": 10, "Beach Boy": 10, "Make You Sick": 10, "Never Ending": 10}'::jsonb WHERE id = '7b25a080-06bb-47c7-9257-d4b87f412152';

-- Eugenio: Todos mueren en abril - Todos mueren en abril
UPDATE reviews SET track_ratings = '{"premiación al peor actor del año": 5, "que más quieres saber sobre mi": 7, "en otra persona": 9, "pedazos frescos de piel real": 6, "me llega el sol": 6.5, "por eso te quise tanto (feliz)": 3.5, "mesa para uno": 4, "sibuna": 6.5, "nunca es justo, nunca es fácil": 5.5, "no preguntes por mi corazón, ya lo tienes tu": 9, "¿cuánto te quise?": 7.5, "quise ser alguien": 9, "quizás en otra vida": 3, "la sangre se va": 5, "no puedes contradecirme": 6.5, "solo porque sabía que tenía que tomar una decision no significa que pude tomarla": 4.5, "de nada me ha servido confiar": 7, "reencuentro": 8, "mounstro": 6, "detrás de ti": 7.5, "mi flor en cada estación (porque te quiero)": 8.5, "ácaro": 3, "todos mueren en abril": 4, "y sé que nunca lo voy a saber": 4, "seamos nada": 9, "mejor después": 4, "para ser universo": 7, "gizmito gizmón": 4, "las flores que marchitan": 8, "0217": 9.5}'::jsonb WHERE id = 'b66c5580-cd4c-486d-afe3-cd9fef8efd1f';

-- Eugenio: Ashe - Ashlyn
UPDATE reviews SET track_ratings = '{"Save Myself": 6, "Moral of the Story": 6, "Till Forever Falls Apart": 7, "Kansas": 8, "I''m Fine": 8, "Ryne’s Song": 6, "Not Mad Anymore": 9, "When I''m Older": 8, "Moral of the Story (feat. Niall Horan) (Bonus Track)": 6, "Always": 4, "Serial Monogamist": 6, "Taylor": 9, "Me Without You": 4, "Love Is Not Enough": 10}'::jsonb WHERE id = '6e46c02a-a755-49b2-904e-483e80223e08';

-- Abel: Weyes Blood - Titanic Rising
UPDATE reviews SET track_ratings = '{"Titanic Rising": 5, "Everyday": 7, "Mirror Forever": 6, "Something to Believe": 7, "Andromeda": 10, "Wild Time": 7, "A Lot''s Gonna Change": 8, "Picture Me Better": 7, "Movies": 6, "Nearer to Thee": 6}'::jsonb WHERE id = 'e5907979-1c1c-4003-8ba0-7cffc5f89313';

-- Abel: Little Jesus - Disco de Oro
UPDATE reviews SET track_ratings = '{"Los Años Maravillosos": 8, "Disco de Oro": 6, "Fuera de Lugar": 8, "Gracias por Nada": 7, "Ahí Te Ves": 6, "Un Plan Espectacular": 7, "Volver al Futuro": 4, "Los Ángeles, California": 8, "Cine Permanencia Voluntaria": 5, "Duro de Matar": 6, "En Otro Planeta": 7}'::jsonb WHERE id = '74474a74-5c32-4ad4-838d-577cfc6a889c';

-- Abel: Sade - Love Deluxe
UPDATE reviews SET track_ratings = '{"I Couldn''t Love You More": 7, "Mermaid": 5, "No Ordinary Love": 7, "Cherish the Day": 7, "Feel No Pain": 7, "Pearls": 9, "Like a Tattoo": 6, "Kiss of Life": 7, "Bullet Proof Soul": 8}'::jsonb WHERE id = '49c369c8-1947-4270-976d-865827a289b4';

-- Abel: BENEE - Lychee
UPDATE reviews SET track_ratings = '{"Hurt You, Gus": 7, "Doesn''t Matter": 5, "Marry Myself": 7, "Soft Side": 6, "Beach Boy": 8, "Make You Sick": 3, "Never Ending": 5}'::jsonb WHERE id = 'c483bc47-08dd-4372-ac30-5ba8e59c2f8b';

-- Abel: Los Temerarios - Tu Última Canción
UPDATE reviews SET track_ratings = '{"Ahora Pienso Más en Ti": 7, "Me Empiezo a Enamorar": 7, "Corazón de Otro": 8, "Enamorado de Ti": 7, "Mi Secreto": 6, "Eres un Sueño": 9, "La Mujer Que Soñe": 8, "Voy a Quererte Más": 7, "Tu Última Canción": 9, "Una Tarde Fue": 8}'::jsonb WHERE id = 'b9e22905-bc41-4a94-bca5-41f8291a7dea';

-- Valentín: Ashe - Ashlyn
UPDATE reviews SET track_ratings = '{"Save Myself": 4, "Moral of the Story": 7, "Till Forever Falls Apart": 5, "Kansas": 4, "I''m Fine": 4, "Ryne’s Song": 7, "Not Mad Anymore": 6, "When I''m Older": 7, "Moral of the Story (feat. Niall Horan) (Bonus Track)": 1, "Always": 4, "Serial Monogamist": 4, "Taylor": 7, "Me Without You": 4, "Love Is Not Enough": 8}'::jsonb WHERE id = 'bdd726cb-9722-42df-b438-fd579f679757';

-- Cait: Ashe - Ashlyn
UPDATE reviews SET track_ratings = '{"Save Myself": 4, "Moral of the Story": 6, "Till Forever Falls Apart": 6, "Kansas": 1, "I''m Fine": 5, "Ryne’s Song": 1, "Not Mad Anymore": 4, "When I''m Older": 6, "Moral of the Story (feat. Niall Horan) (Bonus Track)": 1, "Always": 5, "Serial Monogamist": 1, "Taylor": 8, "Me Without You": 1, "Love Is Not Enough": 8}'::jsonb WHERE id = '019d2be3-5940-4bc1-ad32-48a6cd9a4b08';

-- Cait: Todos mueren en abril - Todos mueren en abril
UPDATE reviews SET track_ratings = '{"premiación al peor actor del año": 1, "que más quieres saber sobre mi": 10, "en otra persona": 1, "pedazos frescos de piel real": 10, "me llega el sol": 1, "por eso te quise tanto (feliz)": 1, "mesa para uno": 10, "sibuna": 10, "nunca es justo, nunca es fácil": 1, "no preguntes por mi corazón, ya lo tienes tu": 10, "¿cuánto te quise?": 1, "quise ser alguien": 1, "quizás en otra vida": 10, "la sangre se va": 10, "no puedes contradecirme": 1, "solo porque sabía que tenía que tomar una decision no significa que pude tomarla": 1, "de nada me ha servido confiar": 1, "reencuentro": 10, "mounstro": 1, "detrás de ti": 8.5, "mi flor en cada estación (porque te quiero)": 5, "ácaro": 1, "todos mueren en abril": 10, "y sé que nunca lo voy a saber": 7, "seamos nada": 5, "mejor después": 1, "para ser universo": 10, "gizmito gizmón": 5, "las flores que marchitan": 5, "0217": 7.5}'::jsonb WHERE id = 'dd691af8-1bc4-4b06-ad9a-f1dc950e9e59';

-- Cait: Balu Brigada - Almost Feel Good Mixtape
UPDATE reviews SET track_ratings = '{"Danger Zone": 8, "Part Time": 6, "Taxi": 8, "Nightshift": 7, "Nostalgia": 9, "Old Love": 7, "Skype Call": 9, "Treat Me (Interlude)": 9, "Slow Dive": 7, "Good 4 U": 5}'::jsonb WHERE id = '15f4d33d-d694-4931-a47d-e296096e0f74';

-- Abel: Ashe - Ashlyn
UPDATE reviews SET track_ratings = '{"Save Myself": 7, "Moral of the Story": 7, "Till Forever Falls Apart": 6, "Kansas": 5, "I''m Fine": 6, "Ryne’s Song": 6, "Not Mad Anymore": 7, "When I''m Older": 6, "Moral of the Story (feat. Niall Horan) (Bonus Track)": 5, "Always": 5, "Serial Monogamist": 6, "Taylor": 5, "Me Without You": 5, "Love Is Not Enough": 5}'::jsonb WHERE id = '1feb360e-c7fc-44f9-b559-d408cbdde80d';

-- Abel: Linkin Park - Meteora
UPDATE reviews SET track_ratings = '{"Easier to Run": 6, "Figure.09": 8, "Numb": 9, "Hit the Floor": 7, "Somewhere I Belong": 9, "Session": 5, "Faint": 9, "Foreword": 6, "Nobody''s Listening": 6, "Lying from You": 8, "From the Inside": 8, "Don''t Stay": 7, "Breaking the Habit": 10}'::jsonb WHERE id = '758c1fab-01e1-4b99-8f44-48929e961195';

-- Oscar: Ashe - Ashlyn
UPDATE reviews SET track_ratings = '{"Save Myself": 6, "Moral of the Story": 9, "Till Forever Falls Apart": 7, "Kansas": 3, "I''m Fine": 8, "Ryne’s Song": 3, "Not Mad Anymore": 6, "When I''m Older": 3, "Moral of the Story (feat. Niall Horan) (Bonus Track)": 7, "Always": 3, "Serial Monogamist": 1, "Taylor": 5, "Me Without You": 6, "Love Is Not Enough": 7}'::jsonb WHERE id = '336fd259-01cd-4587-866f-9660a0a5db62';

-- Cait: Jenni Rivera - Joyas Prestadas - Pop
UPDATE reviews SET track_ratings = '{"Porque Me Gusta a Morir - Pop": 10, "Detrás de Mi Ventana - Pop": 8, "Resulta - Pop": 7, "Señora - Pop": 8, "A Cambio de Qué - Pop": 8, "A Que No Le Cuentas - Pop": 7, "Lo Siento Mi Amor - Pop": 7, "Como Tu Mujer - Pop": 6, "Basta Ya - Pop": 7, "Que Ganas de No Verte Nunca Más - Pop": 7, "Así Fue - Pop": 9}'::jsonb WHERE id = 'babf18eb-b099-4d45-a0bf-cf7edac1f413';

-- Cait: Selena - Amor Prohibido
UPDATE reviews SET track_ratings = '{"Cobarde - Remasterizado 2024/30th Anniversary": 8, "Tus Desprecios - Remasterizado 2024/30th Anniversary": 9, "Bidi Bidi Bom Bom - Remasterizado 2024/30th Anniversary": 10, "Ya No - Remasterizado 2024/30th Anniversary": 9, "Fotos Y Recuerdos - Remasterizado 2024/30th Anniversary": 10, "Amor Prohibido - Remasterizado 2024/30th Anniversary": 9, "Si Una Vez - Remasterizado 2024/30th Anniversary": 10, "El Chico Del Apartamento 512 - Remasterizado 2024/30th Anniversary": 10, "Techno Cumbia - Remasterizado 2024/30th Anniversary": 8, "No Me Queda Más - Remasterizado 2024/30th Anniversary": 10}'::jsonb WHERE id = '5fac3dcd-c148-4f80-a96a-7beb4b4aa2e9';

-- Abel: Bring Me The Horizon - amo
UPDATE reviews SET track_ratings = '{"i don''t know what to say": 7, "MANTRA": 9, "wonderful life (feat. Dani Filth)": 9, "nihilist blues (feat. Grimes)": 8, "ouch": 6, "fresh bruises": 7, "why you gotta kick me when i''m down?": 8, "sugar honey ice & tea": 8, "medicine": 8, "i apologise if you feel something": 8, "in the dark": 7, "mother tongue": 10, "heavy metal (feat. Rahzel)": 9}'::jsonb WHERE id = '1dc34d0b-7266-424a-8a3c-579e50cdb5a8';

-- Abel: Todos mueren en abril - Todos mueren en abril
UPDATE reviews SET track_ratings = '{"premiación al peor actor del año": 6, "que más quieres saber sobre mi": 6.5, "en otra persona": 4.5, "pedazos frescos de piel real": 3, "me llega el sol": 3, "por eso te quise tanto (feliz)": 3.5, "mesa para uno": 4.5, "sibuna": 3, "nunca es justo, nunca es fácil": 4, "no preguntes por mi corazón, ya lo tienes tu": 7, "¿cuánto te quise?": 4, "quise ser alguien": 7, "quizás en otra vida": 5.5, "la sangre se va": 2.5, "no puedes contradecirme": 6.5, "solo porque sabía que tenía que tomar una decision no significa que pude tomarla": 2.5, "de nada me ha servido confiar": 4, "reencuentro": 5.5, "mounstro": 3, "detrás de ti": 7, "mi flor en cada estación (porque te quiero)": 4, "ácaro": 7, "todos mueren en abril": 6, "y sé que nunca lo voy a saber": 5.5, "seamos nada": 6, "mejor después": 5.5, "para ser universo": 5.5, "gizmito gizmón": 6.5, "las flores que marchitan": 7, "0217": 7.5}'::jsonb WHERE id = 'db0eb52f-b27e-4b62-a378-d4adbd3a306a';

-- Rolis: Señor Kino - Aurora Boreal
UPDATE reviews SET track_ratings = '{"Sueño": 3, "Neblina": 2, "Plantita": 9, "Estrella Fugaz": 10, "Kino": 5, "No Hay Prisa": 8, "Aurora Boreal": 10, "Polvo Estelar": 4, "Hora de Dormir": 9, "Me Quedo Aquí": 8}'::jsonb WHERE id = 'b8955a5c-0fbb-435a-a8cb-3f5846fd7495';

-- Devie: Ashe - Ashlyn
UPDATE reviews SET track_ratings = '{"Save Myself": 7, "Moral of the Story": 9, "Till Forever Falls Apart": 7, "Kansas": 3, "I''m Fine": 7, "Ryne’s Song": 4, "Not Mad Anymore": 4, "When I''m Older": 6, "Moral of the Story (feat. Niall Horan) (Bonus Track)": 3, "Always": 6, "Serial Monogamist": 4, "Taylor": 4, "Me Without You": 7, "Love Is Not Enough": 6}'::jsonb WHERE id = 'e04559fc-092a-4b79-a66d-e2d8d02366da';

-- Kraken: Ashe - Ashlyn
UPDATE reviews SET track_ratings = '{"Save Myself": 4, "Moral of the Story": 7, "Till Forever Falls Apart": 3, "Kansas": 2, "I''m Fine": 3, "Ryne’s Song": 3, "Not Mad Anymore": 6, "When I''m Older": 4, "Moral of the Story (feat. Niall Horan) (Bonus Track)": 1, "Always": 5, "Serial Monogamist": 4, "Taylor": 3, "Me Without You": 5, "Love Is Not Enough": 3}'::jsonb WHERE id = 'ccc5e2de-3b29-4654-ae9c-2aae4ac16335';

-- Daniela: Ashe - Ashlyn
UPDATE reviews SET track_ratings = '{"Save Myself": 6, "Moral of the Story": 6, "Till Forever Falls Apart": 3, "Kansas": 5, "I''m Fine": 4, "Ryne’s Song": 5, "Not Mad Anymore": 5, "When I''m Older": 6, "Moral of the Story (feat. Niall Horan) (Bonus Track)": 8, "Always": 4, "Serial Monogamist": 4, "Taylor": 5, "Me Without You": 4, "Love Is Not Enough": 6}'::jsonb WHERE id = '8ecb331b-4e0a-49d3-9480-243dd4e2360e';

-- Daniela: Sade - Love Deluxe
UPDATE reviews SET track_ratings = '{"I Couldn''t Love You More": 9, "Mermaid": 9, "No Ordinary Love": 8, "Cherish the Day": 8, "Feel No Pain": 9, "Pearls": 9, "Like a Tattoo": 10, "Kiss of Life": 8, "Bullet Proof Soul": 10}'::jsonb WHERE id = 'dc45f7ac-e07c-4584-977a-077997b77795';

-- Daniela: Señor Kino - Aurora Boreal
UPDATE reviews SET track_ratings = '{"Sueño": 9, "Neblina": 9, "Plantita": 10, "Estrella Fugaz": 8, "Kino": 9, "No Hay Prisa": 10, "Aurora Boreal": 8, "Polvo Estelar": 6, "Hora de Dormir": 8, "Me Quedo Aquí": 9}'::jsonb WHERE id = '938ccb00-e085-4586-98cc-9e0ba2e4b0a7';

-- Daniela: Harry Styles - Fine Line
UPDATE reviews SET track_ratings = '{"Treat People With Kindness": 10, "Falling": 10, "Cherry": 10, "Adore You": 9, "Golden": 8, "Lights Up": 10, "Canyon Moon": 8, "To Be So Lonely": 10, "She": 10, "Watermelon Sugar": 8, "Fine Line": 10, "Sunflower, Vol. 6": 10}'::jsonb WHERE id = 'b89a6a0b-34c8-4521-a564-f646ed28e95a';
