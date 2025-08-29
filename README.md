# Miracle - Pharmaceutical Intelligence Platform

A comprehensive web application for exploring and analyzing clinical trial trends between US (ClinicalTrials.gov) and EU (EudraCT) databases. Built with React/TypeScript frontend and FastAPI backend for optimal performance with large datasets.

## ✨ Features

- **📊 Interactive Charts**: Multiple visualization types (bar, pie, line charts)
- **🔍 Advanced Filtering**: Filter by region, condition, date range, and sponsor
- **⚡ Real-time Data**: 5-minute caching with automatic refresh capabilities
- **📱 Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **🎨 Customizable UI**: Adjustable font sizes and drag-and-drop dashboard
- **🔄 Smart Previews**: Instant chart previews without API calls
- **📈 Performance Optimized**: Handles ~551k ClinicalTrials.gov + 44k EudraCT trials

## 🏗️ Architecture

### Frontend Stack
- **React 19.1.1** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling framework
- **React Query** - Powerful data fetching and caching
- **Recharts** - Declarative charting library
- **React Router** - Client-side routing
- **Vite** - Fast build tool and dev server

### Backend Stack
- **FastAPI** - High-performance async web framework
- **Python 3.11** - Modern Python with performance optimizations
- **APScheduler** - Background job scheduling
- **Pandas** - Data manipulation and analysis
- **SQLite** - Lightweight database for caching

### Why Tailwind CSS?
**Tailwind CSS was specifically chosen as part of the project specifications** to demonstrate proficiency with utility-first CSS frameworks. This approach was selected because:

- **Rapid Development**: Utility classes enable quick UI prototyping and consistent styling
- **Maintainability**: No custom CSS files needed, reducing bundle size and complexity
- **Design System**: Predefined utilities ensure consistent spacing, colors, and typography
- **Responsive Design**: Built-in responsive utilities support mobile-first development
- **Customization**: Easily extensible for future branding and theme requirements

The utility-first approach perfectly demonstrates modern CSS architecture principles while meeting the project's specific technical requirements.

## 📁 Repository Structure

```
miracle-tech-assessment/
├── 📖 README.md                           # Project documentation
├── 🗃️ backend/                           # FastAPI backend application
│   ├── 📄 main.py                        # FastAPI application entry point & API endpoints
│   ├── 🗂️ models.py                      # Pydantic data models for validation
│   ├── 💾 database.py                    # SQLite database setup and operations
│   ├── ⏰ scheduler.py                    # Automated data fetching scheduler
│   ├── 📦 requirements.txt               # Python dependencies
│   └── 📁 data/                          # Data cache and database files
│       ├── 📄 clinicaltrials_cache.json  # ClinicalTrials.gov cached data
│       ├── 📄 eudract_data.json          # EudraCT cached data
│       ├── 🗄️ clinical_trials.db         # SQLite database file
│       └── 📄 *.db-*                     # SQLite WAL files
│
└── 🎨 frontend/                          # React/TypeScript frontend application
    ├── 📄 package.json                   # Node.js dependencies and scripts
    ├── ⚙️ vite.config.ts                 # Vite build configuration
    ├── 📄 index.html                     # HTML entry point
    └── 📁 src/                           # Source code directory
        ├── 🔧 main.tsx                   # React application entry point
        ├── 🏠 App.tsx                    # Main application component & routing
        ├── 🎨 index.css                  # Global styles and Tailwind imports
        ├── 📁 components/                # React components
        │   ├── 📊 Charts.tsx             # Main charts page component
        │   ├── 📋 Dashboard.tsx          # Dashboard page with custom layouts
        │   ├── 🔍 FiltersPanel.tsx       # Filter controls and state management
        │   ├── 🎛️ FontSizeWidget.tsx     # Accessibility font size controls
        │   ├── 🔄 RefreshButton.tsx      # Data refresh trigger component
        │   ├── 🧭 Sidebar.tsx            # Navigation sidebar
        │   ├── 👋 WelcomePage.tsx        # Landing/welcome page
        │   ├── 🚫 NotFound.tsx           # 404 error page
        │   ├── 📁 widgets/               # Reusable chart components
        │   │   ├── 🏗️ BaseChartWidget.tsx    # Core chart component with caching
        │   │   ├── 📊 TotalsChartWidget.tsx  # Trial totals visualization
        │   │   ├── 🏥 ConditionsChartWidget.tsx  # Medical conditions charts
        │   │   ├── 🏢 SponsorsChartWidget.tsx    # Sponsor analysis charts
        │   │   ├── 👥 EnrollmentChartWidget.tsx  # Enrollment data charts
        │   │   ├── 📈 StatusChartWidget.tsx      # Trial status charts
        │   │   ├── 🔬 PhasesChartWidget.tsx      # Clinical phases charts
        │   │   ├── 📅 YearsChartWidget.tsx       # Time-based trend charts
        │   │   ├── 🌍 CountriesChartWidget.tsx   # Geographic distribution
        │   │   ├── ⏱️ DurationsChartWidget.tsx   # Trial duration analysis
        │   │   └── 📄 index.ts               # Widget component exports
        │   └── 📁 modals/                  # Modal dialog components
        │       ├── ➕ AddChartsModal.tsx    # Chart selection modal
        │       └── 📄 index.ts             # Modal exports
        ├── 📁 context/                    # React context providers
        │   └── 🔤 FontSizeContext.tsx     # Global font size state management
        ├── 📁 utils/                      # Utility functions and helpers
        │   ├── 📊 dashboardStorage.ts     # Dashboard layout persistence
        │   └── 🔍 filtersStorage.ts       # Filter state persistence
        ├── 📁 assets/                     # Static assets (images, icons)
        └── 📄 vite-env.d.ts               # Vite environment type definitions
```

### Directory Explanations

#### **Backend (`/backend/`)**
- **`main.py`** - Core FastAPI application with REST API endpoints for data aggregation and serving
- **`models.py`** - Pydantic data models for API request/response validation and type safety
- **`database.py`** - SQLite database operations for caching and data persistence
- **`scheduler.py`** - Background job scheduler for automated data fetching from external APIs
- **`data/`** - Cache files and database storage for clinical trial data

#### **Frontend (`/frontend/`)**
- **`src/components/`** - React components organized by functionality
  - **`widgets/`** - Reusable chart components built on BaseChartWidget
  - **`modals/`** - Dialog components for user interactions
- **`src/context/`** - React context providers for global state management
- **`src/utils/`** - Helper functions for data persistence and common operations
- **`src/assets/`** - Static files like images and icons

### Key Architectural Patterns

- **📊 Widget Pattern**: All charts inherit from `BaseChartWidget` for consistent caching and rendering
- **🔄 React Query**: Centralized data fetching with intelligent caching (5-minute stale time)
- **🎨 Utility-First CSS**: Tailwind CSS for maintainable, responsive styling
- **📱 Mobile-First**: Responsive design that works on all screen sizes
- **🔍 Filter State**: Global filter management with localStorage persistence
- **📈 Performance Optimization**: Preview mode, background updates, and smart caching

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** - Backend runtime
- **Node.js 18+** - Frontend build tools
- **npm or yarn** - Package manager

### Installation & Setup

1. **Clone and setup backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Setup frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

3. **Run the application:**
   ```bash
   # Terminal 1: Backend
   cd backend
   python3 -m uvicorn main:app --reload --port 8000

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/docs
   - API ReDoc: http://localhost:8000/redoc

### Data Sources
- **ClinicalTrials.gov**: Official US clinical trials database (500 records cached)
- **EudraCT**: European Clinical Trials Register (500 records cached)
- **Auto-refresh**: ClinicalTrials.gov data refreshes every 24 hours

## 📚 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/clinicaltrials` | Fetch cached ClinicalTrials.gov data |
| `GET` | `/eudract` | Fetch cached EudraCT data |
| `POST` | `/refresh` | Manually refresh ClinicalTrials.gov data |
| `GET` | `/conditions` | Get unique medical conditions for filtering |
| `GET` | `/min_max_date` | Get date range constraints |

### Aggregation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/aggregations/totals` | Total trial counts by source |
| `GET` | `/aggregations/by_condition` | Top conditions by trial count |
| `GET` | `/aggregations/by_sponsor` | Top sponsors by trial count |
| `GET` | `/aggregations/enrollment_by_region` | Enrollment numbers by region |
| `GET` | `/aggregations/by_status` | Trial status distribution |
| `GET` | `/aggregations/by_phase` | Trial phase distribution |
| `GET` | `/aggregations/by_year` | Trial trends over time |
| `GET` | `/aggregations/by_country` | Trials by country |
| `GET` | `/aggregations/by_duration` | Trial duration distribution |

### Query Parameters (for aggregation endpoints)
- `region`: Filter by region (`US`, `EU`, or `ALL`)
- `conditions`: Filter by medical conditions (comma-separated)
- `start_date`: Filter by start date (YYYY-MM-DD)
- `end_date`: Filter by end date (YYYY-MM-DD)

## 🔄 Data Management

### Caching Strategy
- **ClinicalTrials.gov**: 24-hour refresh cycle via APScheduler
- **EudraCT**: Cached on startup, manual refresh only
- **Frontend**: 5-minute client-side caching via React Query

### Cache Files
```
backend/data/
├── clinicaltrials_cache.json    # ClinicalTrials.gov data
├── eudract_data.json           # EudraCT data
├── clinical_trials.db          # SQLite database
└── *.db-*                      # SQLite WAL files
```

### Data Pipeline
1. **Fetch**: Retrieve data from external APIs
2. **Parse**: Convert to structured JSON format
3. **Cache**: Store in local files and database
4. **Serve**: Provide aggregated data via REST API
5. **Display**: Render interactive charts in frontend

## ⚠️ Important Notes

### EudraCT Integration
- Uses browser request spoofing to access `/ctr-search/rest/download/full`
- Parses text data into structured JSON format
- Fields may vary (e.g., `F.4.2.1 In the EEA` for enrollment)

### Performance Considerations
- Backend handles ~551k ClinicalTrials.gov + 44k EudraCT trials
- Frontend uses React Query for intelligent caching
- Charts render with dummy data in preview mode

## 🤝 Contributing

### Development Setup
1. Follow the Quick Start guide above
2. Backend API docs available at `http://localhost:8000/docs`
3. Frontend dev server at `http://localhost:5173`

### Code Quality
- **Frontend**: ESLint + TypeScript for type safety
- **Backend**: Pydantic models for data validation
- **Testing**: Manual testing with real data sources

---

*Built with ❤️ using React, TypeScript, FastAPI, and modern web technologies*