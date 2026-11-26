import fs from 'node:fs/promises';
import sharp from 'sharp';
import {ANNUAL_ART} from '../src/data/annual2026Art.mjs';
import academy from '../src/server/annual2026Academy.json' with {type:'json'};
import {buildCubistArt} from './annual-cubist-art.mjs';
const covers=new URL('../public/annual/2026/covers/',import.meta.url),out=new URL('../public/annual/2026/cubist-grammys/',import.meta.url);
for(const piece of ANNUAL_ART){
 const source=academy.releases.find(r=>r.id===piece.id);if(!source||source.title!==piece.title)throw Error('Artwork source mismatch');
 const response=await fetch(source.image,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`Cannot read ${piece.id}`);
 const image=sharp(Buffer.from(await response.arrayBuffer())),metadata=await image.metadata();if(metadata.width<500||metadata.height<500)throw Error('Artwork source is too small');
 await image.resize(1000,1000,{fit:'cover'}).webp({quality:96}).toFile(new URL(`${piece.id}.webp`,covers).pathname.replace(/^\/([A-Z]:)/,'$1'));
 console.log(await buildCubistArt(piece,out));
}
