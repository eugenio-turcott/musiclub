export const ANNUAL_LAUNCH={year:2026,at:'2026-12-28T18:00:00Z',timezone:'America/Mexico_City',dateLabel:'28 de diciembre de 2026',timeLabel:'12:00 p. m.'};
export const annualIsPublished=(now=Date.now())=>Number(now)>=Date.parse(ANNUAL_LAUNCH.at);
