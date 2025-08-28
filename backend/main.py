from fastapi import FastAPI, HTTPException
import requests
import json
import pandas as pd
from pathlib import Path
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow CORS for React frontend (Vite default port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache files
CLINICALTRIALS_CACHE = Path("data/clinicaltrials_cache.json")
EUDRACT_CACHE = Path("data/eudract_data.json")

def fetch_clinicaltrials_data(limit=500):
    """Fetch data from ClinicalTrials.gov API and cache it."""
    try:
        url = "https://clinicaltrials.gov/api/v2/studies"
        params = {
            "pageSize": limit,
            "fields": (
                "protocolSection.identificationModule.nctId,"
                "protocolSection.conditionsModule.conditions,"
                "protocolSection.statusModule.overallStatus,"
                "protocolSection.sponsorCollaboratorsModule.leadSponsor.name,"
                "protocolSection.designModule.enrollmentInfo.count,"
                "protocolSection.contactsLocationsModule.locations"
            )
        }
        logger.info(f"Making request to {url} with params: {params}")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Ensure data directory exists
        CLINICALTRIALS_CACHE.parent.mkdir(exist_ok=True)
        
        # Save to cache with timestamp
        data_with_timestamp = {
            "data": data,
            "last_updated": datetime.utcnow().isoformat()
        }
        with open(CLINICALTRIALS_CACHE, "w") as f:
            json.dump(data_with_timestamp, f)
        logger.info(f"Fetched {len(data.get('studies', []))} ClinicalTrials.gov records")
        return data_with_timestamp
    except requests.RequestException as e:
        logger.error(f"Error fetching ClinicalTrials.gov data: {e}")
        return {"error": str(e), "data": None, "last_updated": datetime.utcnow().isoformat()}


def load_eudract_data():
    """Load EudraCT data from static JSON file."""
    try:
        if not EUDRACT_CACHE.exists():
            logger.warning("EudraCT cache file not found")
            raise HTTPException(status_code=404, detail="EudraCT data file not found")
        with open(EUDRACT_CACHE, "r") as f:
            data = json.load(f)
        logger.info(f"Loaded {len(data)} EudraCT records")
        return data[:500]  # Limit to 500 records
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding EudraCT JSON: {e}")
        raise HTTPException(status_code=500, detail="Invalid EudraCT data format")

# Initialize scheduler
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    """Run initial data fetch and start scheduler."""
    logger.info("Starting server and fetching initial ClinicalTrials.gov data")
    try:
        result = fetch_clinicaltrials_data()  # Run on startup
        if result.get("error"):
            logger.warning("Initial ClinicalTrials.gov fetch failed, but server will continue")
        else:
            scheduler.add_job(fetch_clinicaltrials_data, "interval", hours=24)
            scheduler.start()
            logger.info("Scheduler started for ClinicalTrials.gov data refresh every 24 hours")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        logger.warning("Continuing server startup despite data fetch error")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown scheduler."""
    scheduler.shutdown()
    logger.info("Scheduler shut down")

@app.get("/clinicaltrials")
async def get_clinicaltrials():
    """Retrieve cached ClinicalTrials.gov data."""
    try:
        if CLINICALTRIALS_CACHE.exists():
            with open(CLINICALTRIALS_CACHE, "r") as f:
                return json.load(f)
        result = fetch_clinicaltrials_data()
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error serving ClinicalTrials.gov data: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving ClinicalTrials.gov data")

@app.get("/eudract")
async def get_eudract():
    """Retrieve cached EudraCT data."""
    return load_eudract_data()

@app.post("/refresh")
async def refresh_data():
    """Manually refresh ClinicalTrials.gov data."""
    try:
        result = fetch_clinicaltrials_data()
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        return {
            "status": "Data refreshed",
            "total_records": len(result["data"].get("studies", [])),
            "last_updated": result["last_updated"]
        }
    except Exception as e:
        logger.error(f"Error refreshing data: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh data")

@app.get("/aggregations/totals")
async def get_totals():
    """Get total number of trials from both sources."""
    try:
        ct_data = (await get_clinicaltrials())["data"].get("studies", [])
        eu_data = load_eudract_data()
        return {
            "clinicaltrials_total": len(ct_data),
            "eudract_total": len(eu_data)
        }
    except Exception as e:
        logger.error(f"Error calculating totals: {e}")
        raise HTTPException(status_code=500, detail="Error calculating totals")

@app.get("/aggregations/by_condition")
async def get_by_condition():
    """Aggregate trials by condition."""
    try:
        ct_data = (await get_clinicaltrials())["data"].get("studies", [])
        eu_data = load_eudract_data()
        
        # ClinicalTrials.gov conditions (list of lists)
        ct_conditions = pd.DataFrame([
            {"Condition": cond for cond in study.get("protocolSection", {})
                .get("conditionsModule", {}).get("conditions", [])}
            for study in ct_data
        ])["Condition"].value_counts().head(10).to_dict()
        
        # EudraCT conditions (single string per trial)
        eu_conditions = pd.DataFrame(eu_data)["Medical condition"].value_counts().head(10).to_dict()
        
        return {
            "clinicaltrials_conditions": ct_conditions,
            "eudract_conditions": eu_conditions
        }
    except Exception as e:
        logger.error(f"Error aggregating by condition: {e}")
        raise HTTPException(status_code=500, detail="Error aggregating by condition")

@app.get("/aggregations/by_sponsor")
async def get_by_sponsor():
    """Aggregate trials by sponsor (top 10)."""
    try:
        ct_data = (await get_clinicaltrials())["data"].get("studies", [])
        eu_data = load_eudract_data()
        
        ct_sponsors = pd.DataFrame([
            {"Sponsor": study.get("protocolSection", {})
                .get("sponsorCollaboratorsModule", {})
                .get("leadSponsor", {}).get("name", "Unknown")}
            for study in ct_data
        ])["Sponsor"].value_counts().head(10).to_dict()
        
        eu_sponsors = pd.DataFrame(eu_data)["Sponsor Name"].value_counts().head(10).to_dict()
        
        return {
            "clinicaltrials_sponsors": ct_sponsors,
            "eudract_sponsors": eu_sponsors
        }
    except Exception as e:
        logger.error(f"Error aggregating by sponsor: {e}")
        raise HTTPException(status_code=500, detail="Error aggregating by sponsor")

@app.get("/aggregations/enrollment_by_region")
async def get_enrollment_by_region():
    """Aggregate enrollment totals by region (US, EU, Others)."""
    try:
        ct_data = (await get_clinicaltrials())["data"].get("studies", [])
        eu_data = load_eudract_data()
        
        # ClinicalTrials.gov: Parse locations for US/EU/Others
        ct_enrollment = {"US": 0, "EU": 0, "Others": 0}
        eu_countries = [
            "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark",
            "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland",
            "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
            "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"
        ]
        for study in ct_data:
            enrollment = study.get("protocolSection", {}).get("designModule", {}).get("enrollmentInfo", {}).get("count", 0) or 0
            locations = study.get("protocolSection", {}).get("contactsLocationsModule", {}).get("locations", [])
            is_us = any(loc.get("country", "") == "United States" for loc in locations)
            is_eu = any(loc.get("country", "") in eu_countries for loc in locations)
            if is_us:
                ct_enrollment["US"] += enrollment
            elif is_eu:
                ct_enrollment["EU"] += enrollment
            else:
                ct_enrollment["Others"] += enrollment
        
        # EudraCT: Assume EU unless marked "Outside EU/EEA"
        eu_enrollment = {"EU": 0, "Others": 0}
        for trial in eu_data:
            enrollment = trial.get("Enrolment", 0) or 0  # Handle missing/invalid
            if trial.get("Trial protocol", "").endswith("Outside EU/EEA)"):
                eu_enrollment["Others"] += enrollment
            else:
                eu_enrollment["EU"] += enrollment
        
        return {
            "clinicaltrials_enrollment": ct_enrollment,
            "eudract_enrollment": eu_enrollment
        }
    except Exception as e:
        logger.error(f"Error aggregating enrollment by region: {e}")
        raise HTTPException(status_code=500, detail="Error aggregating enrollment by region")