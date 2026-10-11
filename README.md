# FreshChain AI frontend

An autonomous perishable-inventory control tower: a hackathon prototype frontend.

FreshChain fuses live IoT sensor data, camera-based decay analysis and local demand to estimate true shelf life. Then it acts: it reprices electronic shelf labels, reroutes stock to high-demand hubs, and offloads surplus to B2B buyers or food rescues before the food spoils.

The UI follows one closed loop: **SEE → UNDERSTAND → DECIDE → ACT → MEASURE**.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Live demo

Open `/tower?demo=1`, or press **Simulate spike** in the dock at the bottom of any page. A scripted 40-second incident runs:

1. **SEE**: Chiller C-03 warms from 4.0 °C to 7.2 °C. A cheap rule (Δ ≥ 3.0 °C) fires, so no AI cost is spent before that.
2. **UNDERSTAND**: the Quality agent scores 17% bruising and cuts shelf life from 31 h to 17 h. The Pricing and Logistics agents then add their evidence.
3. **DECIDE**: the Coordinator compares 5 options and picks *transfer 84 + markdown 100 by 20%* with 92% confidence. It auto-executes after 10 s unless held.
4. **ACT**: four simulated webhooks fire: transfer, e-paper shelf label repricing, purchasing feedback and a maintenance ticket.
5. **MEASURE**: ₹15,714 value preserved, 27 kg of food saved, 68 kg CO₂e avoided.

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

All store, sensor and sales data is simulated in `src/lib/data.ts`. Every figure on screen is derived from those constants, so the numbers stay consistent across screens. The incident engine is in `src/lib/sim.ts`.
