# Attribution and provenance

NIGHTSHIFT is maintained by the UTXOPlay organization. This repository contains the racing work extracted from the shared UTXOPlay/myelin-arcade workspace, whose recorded base commit is `077a198` (Decouple game service from UTXOPlay storefront), together with the deployed NIGHTSHIFT 7.0 source and original artwork.

The original MIT license and Myelin contributor copyright notice are retained in `LICENSE`. Myelin dependencies are pinned by Git revision and Cargo.lock. Three.js is MIT-licensed; its notice is retained at `games/arcade/web/licenses/three.txt`, and esbuild retains its bundle license notices.

Generated raster assets and exact prompts are documented in `docs/*art*.json`. `generated-originals/` entries identify original generation filenames for provenance; that directory is not a runtime dependency. The shipped WebP files are included in `games/arcade/web/art/nightshift/`. Map thumbnails and documentation screenshots are captures of the game.

Need for Speed and the linked GitHub racing projects were design references. No EA artwork or source code is included. Nervos and CKB references provide fictional world context and do not imply a settlement integration or endorsement.
