# Spoty

Il tuo lettore musicale personale — tipo Spotify, ma **gratis** e ospitato su GitHub Pages.
Tu carichi i file audio in una cartella, il sito legge da solo titolo/artista/album/copertina dai tag e li rende ascoltabili. Chi visita il sito si crea le proprie playlist e i propri preferiti.

## Come caricare le canzoni

1. Vai nella cartella **`songs/`** qui su GitHub.
2. **Add file → Upload files** e trascina i tuoi `.mp3` (anche `.m4a`, `.flac`, `.ogg`, `.wav`). Puoi usare anche delle sottocartelle.
3. **Commit**. Parte una GitHub Action che, in ~1 minuto, legge i tag e rigenera `songs.json` + le copertine.
4. Ricarica il sito: i brani ci sono.

> I metadati (titolo, artista, album, copertina, durata) vengono presi dai **tag ID3** del file. Se un file non ha tag, il titolo viene ricavato dal nome del file. Per tag e copertine puliti puoi usare [Mp3tag](https://www.mp3tag.de/) o l'app musicale che preferisci.

## Funzioni

- Libreria completa, ricerca per titolo / artista / album
- Playlist multiple (crea, rinomina, elimina, aggiungi/rimuovi brani)
- Brani preferiti (il cuore)
- Player: play/pausa, avanti/indietro, seek, volume, **casuale**, **ripeti** (tutto / singolo)
- Coda "in riproduzione"
- Controlli da lock-screen / cuffie (MediaSession)
- Scorciatoie: `Spazio` play·pausa · `←`/`→` ±5s · `Shift+←/→` brano prec./succ. · `M` muto
- **PWA installabile** e funzionante offline (il guscio; i brani si scaricano in streaming)

Playlist e preferiti sono salvati nel browser di ogni visitatore (`localStorage`): ognuno ha i propri, senza account.

## Impostazioni una tantum (già configurate se hai usato lo script di setup)

- **Settings → Pages →** Deploy from a branch: `main` / `root`.
- **Settings → Actions → General → Workflow permissions:** *Read and write permissions* (serve alla Action per scrivere `songs.json`).

## Struttura

```
index.html                       l'app (single-file)
songs/                           ← i tuoi file audio
covers/                          copertine generate (automatico)
songs.json                       elenco brani generato (automatico)
scripts/build-manifest.mjs       legge i tag e crea songs.json
.github/workflows/               la Action che rigenera tutto a ogni upload
```

## Libreria grande (diversi GB) → Cloudflare R2

GitHub Pages non è adatto a GB di audio (max 100 MB/file, ~1 GB di sito, 100 GB/mese di banda). Per una libreria grande metti l'audio su **Cloudflare R2** (10 GB gratis, banda in uscita gratuita) e lascia nel repo solo `songs.json`. L'app riproduce da qualsiasi URL, quindi non cambia nulla nell'app.

**Setup una tantum (nella dashboard Cloudflare):**
1. **R2 → Create bucket** (es. `spoty`).
2. Bucket → **Settings → Public access → Allow** (attiva il **Public Development URL** `https://pub-….r2.dev`; per un URL tuo puoi collegare un dominio più avanti).
3. **R2 → Manage API Tokens → Create API Token** (permesso *Object Read & Write*). Segna Access Key ID e Secret.
4. Segna il tuo **Account ID** (in alto a destra nella dashboard R2).

**Ogni volta che aggiorni la libreria (dal tuo PC):**
```bash
cd tools
npm install
cp r2.config.example.json r2.config.json   # e compila accountId, chiavi, bucket, publicBaseUrl
node upload-r2.mjs /percorso/della/tua/musica   # default: ../music
```
Lo script legge i tag, carica su R2 solo i file nuovi (salta quelli già presenti), scrive `songs.json` con gli URL R2 e crea il file `.r2-managed`. Poi:
```bash
cd .. && git add songs.json .r2-managed && git commit -m "aggiorna libreria" && git push
```

> `.r2-managed` dice alla GitHub Action di NON rigenerare `songs.json` (che ora è gestito da R2). La cartella `music/` locale e `tools/r2.config.json` (con le chiavi) sono in `.gitignore`: non finiscono su GitHub.

## Note

- GitHub Pages: ~1 GB di spazio e ~100 GB/mese di banda consigliati — più che sufficienti per uso personale.
- Il repository deve essere **pubblico** perché il sito e i brani siano raggiungibili con il piano gratuito.
- Carica solo musica di cui hai i diritti.
