// Scansiona songs/, legge i tag ID3 (titolo, artista, album, copertina, durata)
// e genera songs.json + le copertine in covers/.
// Eseguito dalla GitHub Action a ogni upload. Nessuna dipendenza a mano.

import { parseFile } from 'music-metadata';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SONGS_DIR  = 'songs';
const COVERS_DIR = 'covers';
const OUT        = 'songs.json';
const AUDIO_EXT  = new Set(['.mp3', '.m4a', '.mp4', '.flac', '.ogg', '.oga', '.opus', '.wav', '.aac', '.webm']);
const PIC_EXT    = { 'image/jpeg':'.jpg', 'image/jpg':'.jpg', 'image/png':'.png', 'image/webp':'.webp', 'image/gif':'.gif' };

async function walk(dir){
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full));
    else if (AUDIO_EXT.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

const posix = p => p.split(path.sep).join('/');
const idFor = rel => crypto.createHash('sha1').update(rel).digest('hex').slice(0, 12);

async function main(){
  if (!existsSync(SONGS_DIR)) { await writeFile(OUT, '[]\n'); console.log('No songs/ dir — wrote empty manifest.'); return; }
  await mkdir(COVERS_DIR, { recursive: true });

  const files = (await walk(SONGS_DIR)).sort();
  console.log(`Found ${files.length} audio file(s).`);
  const songs = [];
  const coverCache = new Map(); // picture-hash -> covers/<hash>.<ext>

  for (const file of files) {
    const rel = posix(file);
    const base = path.basename(file).replace(/\.[^.]+$/, '');
    let common = {}, format = {};
    try {
      const meta = await parseFile(file, { duration: true });
      common = meta.common || {};
      format = meta.format || {};
    } catch (err) {
      console.warn(`  ! tag read failed for ${rel}: ${err.message}`);
    }

    // cover art
    let cover = '';
    const pic = (common.picture && common.picture[0]) || null;
    if (pic && pic.data && pic.data.length) {
      const buf = Buffer.from(pic.data);
      const h = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
      if (coverCache.has(h)) {
        cover = coverCache.get(h);
      } else {
        const ext = PIC_EXT[(pic.format || '').toLowerCase()] || '.jpg';
        const outPath = `${COVERS_DIR}/${h}${ext}`;
        if (!existsSync(outPath)) await writeFile(outPath, buf);
        cover = outPath;
        coverCache.set(h, outPath);
      }
    }

    let added = 0;
    try { added = Math.floor((await stat(file)).mtimeMs); } catch {}

    songs.push({
      id: idFor(rel),
      title: (common.title || base).trim(),
      artist: (common.artist || (common.artists && common.artists[0]) || 'Sconosciuto').trim(),
      album: (common.album || '').trim(),
      track: (common.track && common.track.no) || 0,
      disc: (common.disk && common.disk.no) || 0,
      duration: Math.round(format.duration || 0),
      src: rel,
      cover,
      added,
    });
  }

  // ordina per artista → album → disco → traccia → titolo
  const c = new Intl.Collator('it', { sensitivity: 'base', numeric: true });
  songs.sort((a, b) =>
    c.compare(a.artist, b.artist) ||
    c.compare(a.album, b.album) ||
    (a.disc - b.disc) ||
    (a.track - b.track) ||
    c.compare(a.title, b.title)
  );

  await writeFile(OUT, JSON.stringify(songs, null, 0) + '\n');
  console.log(`Wrote ${OUT} with ${songs.length} track(s) and ${coverCache.size} cover(s).`);
}

main().catch(e => { console.error(e); process.exit(1); });
