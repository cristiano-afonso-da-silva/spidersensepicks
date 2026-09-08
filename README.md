# Spider Sense Picks

Display-only performance dashboard. Picks are stored in `data/picks.json` and updated offline (not through the public site).

## Daily update workflow

Each day, send the new card in chat (example):

```
5 Unit Plays
Florida State (+3.5) ✅  -140

1 Unit Plays
Dodgers ML ✅  -220
SMU @ FSU Under 54.5 ✅  -110
```

Include for each play when you can: **pick**, **units**, **odds** (American), **win/loss/push**.  
The agent appends them to `data/picks.json`; the dashboard recalculates automatically.

## Pick record shape

```json
{
  "id": "2026-09-08-fsu",
  "date": "2026-09-08",
  "pick": "Florida State (+3.5)",
  "sport": "NCAAF",
  "odds": -140,
  "units": 5,
  "result": "win",
  "notes": "5 Unit Play"
}
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
