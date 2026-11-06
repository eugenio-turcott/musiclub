import {gzipSync,gunzipSync} from 'node:zlib';
import {Buffer} from 'node:buffer';

// Next's data cache rejects JSON values over 2 MB. Compress the server-only
// snapshot so catalogue growth does not silently turn cache hits into DB reads.
export function packCatalogSnapshot(data){
 return gzipSync(Buffer.from(JSON.stringify(data)),{level:1}).toString('base64');
}
export function unpackCatalogSnapshot(value){
 return JSON.parse(gunzipSync(Buffer.from(value,'base64')).toString('utf8'));
}
