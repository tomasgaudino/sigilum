# Sigilum Dashboard

A modern React dashboard for visualizing Sigilum pipeline runs, performance metrics, and bottleneck analysis.

## Features

- **Run Overview**: View all your pipeline runs with key metrics
- **Performance Analysis**: Identify bottlenecks across different phases
- **Interactive Charts**: Bar charts, pie charts, and timeline visualizations
- **Trial Comparison**: Compare performance across different parameter combinations
- **Search & Filter**: Find specific runs quickly
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

```bash
cd sigilum-dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## Data Integration

Currently uses mock data based on your run structure. To integrate with real data:

1. **Option 1: Simple File Server**
   ```bash
   # Create a simple Express server to serve run data
   npm install express cors
   # See src/api/fileSystem.ts for implementation details
   ```

2. **Option 2: Direct File Access** (Electron app)
   - Wrap the React app in Electron for direct file system access
   - Read trials from `runs/*/trials/*/phases_chain.json`

3. **Option 3: Python Backend**
   - Create a Flask/FastAPI server to scan runs directory
   - Serve JSON data to the React frontend

## File Structure

```
sigilum-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── RunCard.tsx     # Individual run display
│   │   ├── RunDetails.tsx  # Detailed run analysis
│   │   ├── BottleneckChart.tsx  # Performance charts
│   │   └── TrialTimeline.tsx    # Trial progression
│   ├── utils/
│   │   └── dataLoader.ts   # Data loading and analysis
│   ├── api/
│   │   └── fileSystem.ts   # File system integration
│   └── types.ts            # TypeScript definitions
├── public/                 # Static assets
└── dist/                   # Build output
```

## Customization

### Adding New Metrics
1. Update `types.ts` with new data structures
2. Modify `dataLoader.ts` to calculate new metrics
3. Create new chart components as needed

### Styling
- Uses Tailwind CSS for consistent styling
- Modify `tailwind.config.js` for theme customization
- Color scheme optimized for data visualization

## Performance Features

The dashboard provides detailed analysis of:

- **Phase Timing**: Average, min, max execution times per phase
- **Bottleneck Identification**: Automatically identifies slowest phases
- **Trial Comparison**: Compare different parameter combinations
- **Time Composition**: See how much time each phase contributes
- **Performance Trends**: Track performance across multiple runs

## Production Deployment

```bash
npm run build
npm run preview
```

For production, consider:
- Setting up a proper backend API
- Adding authentication if needed
- Configuring proper CORS policies
- Setting up monitoring and error tracking