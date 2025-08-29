# Frontend Architecture Documentation

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── widgets/         # Chart widget components
│   │   │   ├── BaseChartWidget.tsx    # Core chart component
│   │   │   ├── TotalsChartWidget.tsx  # Trial totals chart
│   │   │   ├── ConditionsChartWidget.tsx
│   │   │   ├── SponsorsChartWidget.tsx
│   │   │   ├── EnrollmentChartWidget.tsx
│   │   │   ├── StatusChartWidget.tsx
│   │   │   ├── PhasesChartWidget.tsx
│   │   │   ├── YearsChartWidget.tsx
│   │   │   ├── CountriesChartWidget.tsx
│   │   │   ├── DurationsChartWidget.tsx
│   │   │   └── index.ts               # Widget exports
│   │   ├── modals/
│   │   │   ├── AddChartsModal.tsx     # Chart selection modal
│   │   │   └── index.ts
│   │   ├── Charts.tsx                 # Main charts page
│   │   ├── Dashboard.tsx              # Dashboard page
│   │   ├── FiltersPanel.tsx           # Filter controls
│   │   ├── FontSizeWidget.tsx         # Accessibility controls
│   │   ├── RefreshButton.tsx          # Data refresh controls
│   │   ├── Sidebar.tsx                # Navigation sidebar
│   │   ├── WelcomePage.tsx            # Landing page
│   │   └── NotFound.tsx               # 404 error page
│   ├── context/
│   │   └── FontSizeContext.tsx        # Global font size state
│   ├── utils/
│   │   ├── dashboardStorage.ts        # Dashboard persistence
│   │   └── filtersStorage.ts          # Filter state persistence
│   ├── App.tsx                        # Main application component
│   ├── main.tsx                       # Application entry point
│   └── index.css                      # Global styles
├── public/
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
└── vite.config.ts                     # Vite build configuration
```

## 🧩 Component Architecture

### Core Components

#### `BaseChartWidget<T>`
The foundation component for all chart visualizations. Handles:
- **Data fetching** via React Query with intelligent caching
- **Chart rendering** for bar, pie, and line charts using Recharts
- **Preview mode** with realistic dummy data (no API calls)
- **Error handling** and loading states
- **Accessibility** with font size controls
- **Responsive design** with automatic layout adjustments

**Props:**
- `endpoint`: API endpoint for data fetching
- `title`: Chart title for display
- `chartConfig`: Chart type and configuration
- `transformData`: Function to transform raw API data
- `isPreview`: Enable preview mode with dummy data
- `filters`: Current filter state for API queries
- `refreshTrigger`: Force data refresh signal

#### Widget Components
Each chart type extends `BaseChartWidget` with specific configurations:

- **TotalsChartWidget**: Shows ClinicalTrials.gov vs EudraCT totals
- **ConditionsChartWidget**: Top 10 medical conditions by trial count
- **SponsorsChartWidget**: Trial distribution by sponsor
- **EnrollmentChartWidget**: Enrollment numbers by region
- **StatusChartWidget**: Trial status distribution
- **PhasesChartWidget**: Clinical trial phases comparison
- **YearsChartWidget**: Trial trends over time
- **CountriesChartWidget**: Geographic distribution
- **DurationsChartWidget**: Trial duration analysis

### State Management

#### React Query (Data Layer)
- **Caching**: 5-minute stale time for optimal performance
- **Background updates**: Shows cached data while fetching fresh data
- **Automatic retries**: Handles network failures gracefully
- **Smart invalidation**: Clears cache when filters change

#### Context API (UI State)
- **FontSizeContext**: Global accessibility settings
- **FilterState**: Current filter selections (region, conditions, dates)

### Routing Architecture

```
App (FontSizeProvider)
├── Sidebar (Navigation)
├── FontSizeWidget (Accessibility)
└── Routes
    ├── "/" → WelcomePage
    ├── "/charts" → Charts (Main analytics)
    └── "/dashboard/:id" → Dashboard (Saved views)
```

## 🎨 Design System

### Styling Approach
- **Tailwind CSS v4**: Utility-first CSS framework
- **Component-based**: Styles co-located with components
- **Responsive**: Mobile-first design principles
- **Accessible**: High contrast ratios and focus states

### Color Palette
```typescript
const COLORS = [
  '#0088FE', // Blue
  '#00C49F', // Teal
  '#FFBB28', // Yellow
  '#FF8042', // Orange
  '#8884d8', // Purple
  '#82ca9d', // Green
  '#ffc658', // Gold
  '#ff7300', // Red-Orange
  '#a4de6c', // Light Green
  '#d0ed57'  // Lime
];
```

### Typography Scale
- **Large**: `text-xl` (20px)
- **Normal**: `text-lg` (18px)
- **Small**: `text-base` (16px)

## 🔄 Data Flow

### 1. User Interaction
- User selects filters in `FiltersPanel`
- Filter state updates trigger React Query invalidation
- Components re-fetch data with new parameters

### 2. Data Fetching
- `BaseChartWidget` uses React Query for API calls
- Query key includes endpoint + filters for smart caching
- Failed requests automatically retry up to 2 times

### 3. Data Transformation
- Raw API data passed to `transformData` function
- Component-specific logic converts API format to chart format
- Data truncation applied for better visualization

### 4. Chart Rendering
- Recharts library renders appropriate chart type
- Responsive containers adapt to screen size
- Custom tooltips and legends enhance readability

## 🚀 Performance Optimizations

### Caching Strategy
- **5-minute stale time**: Balances freshness with performance
- **Background refetch**: Users see cached data instantly
- **Query deduplication**: Identical requests share cache
- **Smart invalidation**: Only affected queries refresh

### Preview Mode
- **No API calls**: Charts render with dummy data
- **Instant loading**: No network latency for previews
- **Realistic appearance**: Users see actual chart structure
- **Performance boost**: Faster modal interactions

### Bundle Optimization
- **Tree shaking**: Unused code removed by Vite
- **Code splitting**: Dynamic imports for large libraries
- **Asset optimization**: Images and fonts optimized
- **Development HMR**: Fast hot module replacement

## 🧪 Testing Strategy

### Component Testing
- **Unit tests**: Individual component functionality
- **Integration tests**: Component interactions
- **E2E tests**: Complete user workflows

### Data Flow Testing
- **API mocking**: Simulated backend responses
- **Error scenarios**: Network failures and edge cases
- **Loading states**: Skeleton screens and spinners

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Chart Responsiveness
- **Auto-sizing**: Charts adapt to container width
- **Text scaling**: Font sizes adjust for readability
- **Touch-friendly**: Interactive elements sized for mobile

## 🔧 Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

### Code Quality
- **ESLint**: Code quality and consistency
- **TypeScript**: Type safety and IntelliSense
- **Prettier**: Code formatting (via ESLint)
- **Husky**: Pre-commit hooks (planned)

## 🚨 Error Handling

### Network Errors
- **Retry logic**: Automatic retry with exponential backoff
- **Graceful degradation**: Fallback UI for failed requests
- **User feedback**: Clear error messages and retry options

### Data Errors
- **Validation**: Pydantic models in backend
- **Type safety**: TypeScript interfaces in frontend
- **Fallback data**: Default values for missing fields

### User Experience
- **Loading states**: Skeleton screens and spinners
- **Error boundaries**: Graceful error recovery
- **Offline support**: Cached data for offline viewing

## 🔮 Future Enhancements

### Planned Features
- **Dashboard persistence**: Save custom dashboard layouts
- **Advanced filtering**: More granular filter options
- **Export functionality**: Download charts as images/PDF
- **Real-time updates**: WebSocket connections for live data
- **Advanced analytics**: Statistical analysis and trends

### Technical Improvements
- **Performance monitoring**: Track bundle size and runtime metrics
- **Accessibility audit**: WCAG compliance improvements
- **Internationalization**: Multi-language support
- **Progressive Web App**: Offline functionality and installability

---

*This architecture supports scalable, maintainable frontend development with optimal performance for large clinical trial datasets.*
