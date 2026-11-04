export const validPoolCode=value=>/^[A-Z0-9]{12}$/.test(String(value || ''));
export function poolUrl(roomId,season) {
  if(validPoolCode(season?.public_code))return `/pool/${season.public_code}`;
  return `/pool?sala=${encodeURIComponent(roomId)}${season?.id?`&temporada=${encodeURIComponent(season.id)}`:''}`;
}
