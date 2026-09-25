import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta el id del álbum de Spotify' },
        { status: 400 }
      );
    }

    const cleanId = String(id).trim();
    const res = await fetch(`https://open.spotify.com/embed/album/${cleanId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Spotify embed respondió con status ${res.status}` },
        { status: res.status }
      );
    }

    const htmlText = await res.text();
    const marker = 'id="__NEXT_DATA__"';
    const idx = htmlText.indexOf(marker);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: 'Estructura de Spotify embed no encontrada' },
        { status: 404 }
      );
    }

    const start = htmlText.indexOf('>', idx) + 1;
    const end = htmlText.indexOf('</script>', start);
    const json = JSON.parse(htmlText.substring(start, end));
    const entity = json?.props?.pageProps?.state?.data?.entity;
    if (!entity) {
      return NextResponse.json(
        { success: false, error: 'Datos del álbum no encontrados en el embed' },
        { status: 404 }
      );
    }

    const rawTracks = entity.trackList || [];
    const tracks = rawTracks.map((t, i) => ({
      id: t.uri ? t.uri.split(':')[2] : t.id || `sp_${i + 1}`,
      name: t.title,
      duration_ms: t.duration || 0,
      track_number: i + 1,
    }));

    const images = entity.visualIdentity?.image || [];
    const bestImage =
      images.find((img) => img.maxHeight >= 600)?.url ||
      images[0]?.url ||
      '';

    let releaseYear = null;
    if (entity.releaseDate) {
      const y = parseInt(entity.releaseDate.substring(0, 4), 10);
      if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
    }

    let releaseType = 'ALBUM';
    if (tracks.length <= 2) releaseType = 'SENCILLO';
    else if (tracks.length <= 7) releaseType = 'EP';

    const artistName = entity.subtitle || 'Artista';

    return NextResponse.json({
      success: true,
      album: {
        id: cleanId,
        name: entity.name,
        artists: [artistName],
        artists_data: [{ id: null, name: artistName }],
        primaryArtistId: null,
        image: bestImage,
        releaseDate: entity.releaseDate || null,
        releaseYear: releaseYear,
        album_type: releaseType.toLowerCase(),
        release_type: releaseType,
        genres: [],
        label: '',
        popularity: null,
        totalTracks: tracks.length,
        tracks: tracks,
        external_urls: {
          spotify: `https://open.spotify.com/album/${cleanId}`,
        },
        source: 'SPOTIFY_EMBED',
      },
    });
  } catch (err) {
    console.error('Error en /api/spotify/embed:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
