# Miracle - Pharmaceutical Intelligence Platform

A web application built to explore trends in US vs. EU clinical trials, featuring a React/TypeScript frontend and a FastAPI backend.

## Frontend
The welcome page is built with **React**, **TypeScript**, and **Tailwind CSS v4**.

### Why Tailwind CSS?
I chose Tailwind CSS because it's highly customizable. With utility-first classes, I can easily:
- Modify colors, spacing, and layouts
- Create consistent design systems
- Build responsive interfaces quickly
- Customize the design to match any brand requirements

The utility-based approach makes it simple to adjust the visual design without writing custom CSS, while maintaining a clean and maintainable codebase.

## Backend
The backend is built with **FastAPI**, **Python 3.11**, **APScheduler**, and **pandas**, handling data from ClinicalTrials.gov and EudraCT.

### Data Sources
- **ClinicalTrials.gov**: Fetched programmatically via the API (`https://clinicaltrials.gov/api/v2/studies`), limited to 500 records, cached in `data/clinicaltrials_cache.json`.
- **EudraCT**: Programmatically fetched by spoofing the download endpoint (`https://www.clinicaltrialsregister.eu/ctr-search/rest/download/full`) using a session-based approach to mimic browser behavior and obtain cookies. Text data is parsed into JSON and cached in `data/eudract_data.json` (limited to 500 records).

### Setup Instructions
1. Ensure **Python 3.11** is installed: `python3 --version`
2. Create and activate a virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install backend dependencies:
   ```bash
   python3 -m pip install --upgrade pip
   python3 -m pip install fastapi uvicorn requests pandas python-dateutil apscheduler
   ```
4. Install frontend dependencies (assuming a `frontend` directory with React app):
   ```bash
   cd frontend
   npm install
   ```
5. Run the backend server:
   ```bash
   cd backend
   python3 -m uvicorn main:app --reload --port 8000
   ```
   - Fetches ClinicalTrials.gov and EudraCT data on startup if caches (`data/clinicaltrials_cache.json`, `data/eudract_data.json`) are missing. EudraCT fetch takes ~75s for 500 trials (25 pages, 3s delay per page).
6. Run the frontend (e.g., with Vite):
   ```bash
   cd frontend
   npm run dev
   ```
   - Frontend runs on `http://localhost:5173` (Vite default).

### Endpoints
- **GET /clinicaltrials**: Fetch cached ClinicalTrials.gov data (500 records).
- **GET /eudract**: Fetch cached EudraCT data (500 records).
- **POST /refresh**: Manually refresh ClinicalTrials.gov data.
- **GET /aggregations/totals**: Total trials for both sources.
- **GET /aggregations/by_condition**: Top 10 conditions.
- **GET /aggregations/by_sponsor**: Top 10 sponsors.
- **GET /aggregations/enrollment_by_region**: Enrollment by US, EU, Others.

### Scheduling
- **ClinicalTrials.gov**: Data is fetched on server startup and every 24 hours via APScheduler.
- **EudraCT**: Fetched on startup if cache is missing (static file, not scheduled for refresh).

### Notes
- **EudraCT Spoofing**: Data is fetched by mimicking browser requests to `/ctr-search/rest/download/full`, parsing text into JSON with fields like `EudraCT Number`, `Name of Sponsor`, `Medical condition(s) being investigated`, `F.4.2.1 In the EEA`.
- **Cache Files**: Ensure `data/` directory exists. Caches are stored as `clinicaltrials_cache.json` and `eudract_data.json`.
- **Field Mapping**: EudraCT fields may vary (e.g., `F.4.2.1 In the EEA` for enrollment); verify in `eudract_data.json`.
- **Assisted by**: Grok (xAI) for code, debugging, and API spoofing logic.