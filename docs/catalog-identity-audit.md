# Catalogue identity and continuation checks

V.12.3.3 audits provider identities separately from user reviews. Never replace
a reviewed tracklist with the first search result, the longest edition, or an
unrelated artist's similarly titled work.

## Read-only audit

Run `node scripts/audit-catalog-identities.mjs` with the existing Supabase public
configuration. It reads every catalogue row and compares concrete Spotify,
Apple Music and Deezer release links. Search links are not identity evidence.
Spotify's public embed is used when its application API is unavailable.

The resumable report is written to `outputs/v1233/catalog-identity-audit.json`.
`matched` means the returned title, artist credit, type and known track count
agree. `conflict` includes legitimate edition differences and requires review.
`unavailable` does not authorize a replacement. The audit is not proof of every
recording, cover pixel, geographic availability or artist alias.

The November 26 audit read 1,028 records and 1,381 concrete links. Nine provider
reads remained unavailable. Confirmed wrong-work links were repaired without
deleting releases or moving reviews; unresolved exact editions retain a clearly
scoped search link rather than another work's identifier. Expectations and The
Life of a Showgirl had no reviews and were corrected against their official
complete editions. SOS was imported after its recordings matched reviewed LANA.

`prepare-catalog-identity-repairs.mjs` writes a proposed SQL plan and before/after
JSON; it never applies it. Inspect artist aliases, translations and regional
editions before executing. Updates guard the original URL to preserve subsequent
changes. Existing reviews and scores must remain untouched.

## Cross-catalogue continuations

The private continuation route reads only the authenticated user's reviews.
External discovery runs after its response; notifications refresh once after
30 seconds and after saving a review. The review editor uses existing local
matches immediately. No email is sent by this feature.

Import requires a complete, released edition with matching credited artists and
at least five individually matched recordings, or one for the single exception.
ISRCs, provider aliases, or exact titles plus duration prove recordings. Repeated
occurrences cannot multiply a rating. Already-reviewed/local editions are skipped;
the standard album has priority over an expanded version. Deterministic import
IDs make concurrent discoveries converge; database permissions still apply.

## Yearbook artwork

`docs/data/annual-2026-artwork-sources.json` records the twenty official source
covers, dates, provider IDs and catalogue IDs. Each selected work is a 2026 album.
Run `prepare-annual-academy-selection.mjs` to verify sources, then
`build-annual-academy-art.mjs` to regenerate square artwork. Do not substitute an
older album to fill an unavailable image. Public notes stay consolidated by major
version; the internal patch entry is V.12.3.3.
