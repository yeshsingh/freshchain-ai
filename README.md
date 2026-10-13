# FreshChain AI

> **Full guide** (both repos, every page, data sources, AI, maths, PostgreSQL, deploy, Git, troubleshooting): [FRESHCHAIN_GUIDE.md](FRESHCHAIN_GUIDE.md)

An autonomous perishable-inventory control tower: a hackathon prototype frontend.

FreshChain fuses live IoT sensor data, camera-based decay analysis and local demand to estimate true shelf life. Then it acts: it reprices electronic shelf labels, reroutes stock to high-demand hubs, and offloads surplus to B2B buyers or food rescues before the food spoils.

The UI follows one closed loop: **SEE → UNDERSTAND → DECIDE → ACT → MEASURE**.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 — offline demo, no backend needed
```

**With the FastAPI backend** ([fresh-ai](https://github.com/Sharshita24/fresh-ai)), the dashboard shows real data and the live demo runs on the backend's agents:

```bash
# terminal 1 — backend
cd fresh-ai && uvicorn app.main:app --port 8000
# terminal 2 — frontend
cd freshchain-ai && BACKEND_URL=http://127.0.0.1:8000 npm run dev
```

The frontend proxies `/backend/*` to `BACKEND_URL`, so no CORS setup is needed. Open **System health** (top right) to check whether it's connected. If the backend is unreachable, the app falls back to the offline simulation on its own.

## Live demo

Open `/tower?demo=1`, or press **Simulate spike** in the dock at the bottom of any page. A 40-second incident runs. When connected, the chiller readings are posted to the backend, which detects the anomaly, runs its agents and returns the decision. Approving executes it there. Offline, the same story plays from bundled data.

1. **SEE**: Chiller C-03 warms from 4.0 °C to 7.2 °C. A cheap rule (Δ ≥ 3.0 °C) fires, so no AI cost is spent before that.
2. **UNDERSTAND**: the Quality agent scores 17% bruising and cuts shelf life from 31 h to 17 h. The Pricing and Logistics agents then add their evidence.
3. **DECIDE**: the Coordinator compares 5 options and picks *transfer 84 + markdown 100 by 20%* with 92% confidence. It auto-executes after 10 s unless held.
4. **ACT**: four simulated webhooks fire: transfer, e-paper shelf label repricing, purchasing feedback and a maintenance ticket.
5. **MEASURE**: ₹16,290 value preserved, 28 kg of food saved, 71 kg CO₂e avoided.

With **Auto-tour** on, the app follows the incident across screens. Keyboard shortcuts: `S` simulate, `A` approve, `H` hold, `R` reset.

## Screens

| Perspective | Screen | Route |
| --- | --- | --- |
| Operations | Overview (control tower) | `/tower` |
| Operations | At-risk inventory | `/inventory` |
| Operations | History / audit trail | `/history` |
| AI Control Tower | Batch investigation | `/batch/[id]` |
| AI Control Tower | AI decision center | `/decision` |
| AI Control Tower | Action execution | `/execution` |
| AI Control Tower | Network & impact | `/network` |

## Stack

Next.js 16 (App Router, fully static), React 19, Tailwind CSS 4, Motion and Zustand. The charts are hand-built SVG.

`src/lib/api.ts` is the typed backend client. `src/lib/sim.ts` paces the live incident and talks to the backend when it is connected. `src/lib/data.ts` holds the offline dataset, which matches what the backend computes for the same scenario.

## Deploy

- **Frontend:** import the repo on Vercel. Set `BACKEND_URL` to the deployed backend to go live. Leave it unset for the offline demo.
- **Backend:** `docker build -t freshchain-api . && docker run -p 8080:8080 freshchain-api`. It runs on Cloud Run as-is (`gcloud run deploy --source .`).
