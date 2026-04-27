# Ant Simulator

A 2D browser-based ant colony management game with AI-driven ants, role-specific behaviors, and PixiJS rendering.

## About

Build and manage your ant colony in this real-time simulation. Watch as different ant roles - workers, soldiers, nurses, scouts, guards, and the queen - interact with their environment using GOAP (Goal-Oriented Action Planning) AI.

### Features

- **Role-Based AI**: Each ant type has specialized behaviors and decision-making
  - **Queen**: Lays eggs and manages colony growth
  - **Workers**: Gather food, maintain nest
  - **Soldiers**: Defend against threats
  - **Nurses**: Care for brood
  - **Scouts**: Explore for new food sources
  - **Guards**: Protect nest entrances

- **Dual View System**: Switch between surface (top-down) and underground (side-view) perspectives
- **GOAP + Reactive AI**: Ants plan their actions while responding to immediate threats
- **Tunnel System**: Procedurally generated underground network with sprite-based rendering
- **8-bit Retro Aesthetic**: Pixel-art graphics with a nostalgic feel

## Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move selected ant |
| Mouse Click | Command ant to location |
| V | Toggle surface/underground view |
| I | Show ant statistics |
| +/- | Adjust game speed |

## Architecture

```
src/
├── game/                   # Game logic
│   ├── GameCore.ts        # Main game controller
│   ├── AntEntity.ts       # Ant data model
│   ├── ColonyState.ts     # Colony state management
│   ├── ai/                # AI systems
│   │   ├── AntAIManager.ts    # AI coordinator
│   │   ├── AIContext.ts       # Environment awareness
│   │   ├── GOAPPlanner.ts     # Goal planning
│   │   ├── ReactiveLayer.ts   # Threat response
│   │   ├── types.ts           # Type definitions
│   │   └── behaviors/        # Role-specific AI
│   │       ├── BaseAntAI.ts
│   │       ├── QueenAI.ts
│   │       ├── WorkerAI.ts
│   │       └── ...
│   └── systems/           # Game systems
│       ├── HungerSystem.ts
│       ├── BroodSystem.ts
│       └── ...
├── renderer/              # Rendering (PixiJS)
│   ├── GameRenderer.ts
│   ├── Camera.ts
│   ├── SpriteManager.ts
│   └── TunnelRenderer.ts
├── world/                 # World display
│   └── GameCanvas.ts     # Main canvas & controls
├── ui/                    # UI screens
│   ├── screens/           # Menu screens
│   └── components/       # Reusable components
└── assets/                # Sprites & images
    ├── sprites/ants/     # Ant sprite sheets
    └── tunnels.png       # Tunnel tile sprites
```

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **PixiJS v8** - 2D WebGL renderer
- **Vite** - Build tool & dev server

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Gameplay

1. Start a new colony with customizable settings
2. Watch your ants carry out their roles autonomously
3. Click ants to take direct control
4. Press W/A/S/D to move the selected ant
5. Press V to switch between surface and underground views
6. Expand your colony and manage resources

## Development

The game uses a layered AI approach:
- **GOAP Planner**: Long-term goal achievement
- **Reactive Layer**: Immediate threat response
- **Command Priority**: Player commands override AI

See `ant-sim-design.md` for detailed design specifications.

## License

MIT