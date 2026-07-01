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

## Note

- GitHub Pages: ~1 GB di spazio e ~100 GB/mese di banda consigliati — più che sufficienti per uso personale.
- Il repository deve essere **pubblico** perché il sito e i brani siano raggiungibili con il piano gratuito.
- Carica solo musica di cui hai i diritti.
