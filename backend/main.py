from fastapi import FastAPI, HTTPException
import requests
import json
import pandas as pd
from pathlib import Path
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
import re
import time

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

def fetch_eudract_data(limit=500, pages_to_fetch=None):
    """Spoof EudraCT download: Fetch and parse full details for 500 trials."""
    try:
        trials = []
        trials_per_page = 20
        num_pages = pages_to_fetch or (limit // trials_per_page) + 1 if limit % trials_per_page else limit // trials_per_page
        
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.clinicaltrialsregister.eu/ctr-search/search',
        })

        for page in range(1, num_pages + 1):
            # Load search page to get session cookies
            search_url = f"https://www.clinicaltrialsregister.eu/ctr-search/search?query=&page={page}"
            search_response = session.get(search_url, timeout=10)
            search_response.raise_for_status()
            logger.info(f"Loaded search page {page}: Status {search_response.status_code}")

            # Download full details for current page
            download_url = "https://www.clinicaltrialsregister.eu/ctr-search/rest/download/full?query=&mode=current_page"
            download_response = session.get(download_url, timeout=10)
            download_response.raise_for_status()
            text = download_response.text
            
            # Parse text into trials
            page_trials = parse_eudract_text(text)
            trials.extend(page_trials)
            logger.info(f"Fetched {len(page_trials)} trials from page {page} (total so far: {len(trials)})")

            if len(trials) >= limit:
                trials = trials[:limit]
                break

            time.sleep(3)  # Rate limit to avoid bans

        # Ensure data directory exists
        EUDRACT_CACHE.parent.mkdir(exist_ok=True)
        
        # Save to cache with timestamp
        data_with_timestamp = {
            "data": {"studies": trials},
            "last_updated": datetime.utcnow().isoformat()
        }
        with open(EUDRACT_CACHE, "w") as f:
            json.dump(data_with_timestamp, f)
        logger.info(f"Fetched and cached {len(trials)} EudraCT records")
        return data_with_timestamp
    except requests.RequestException as e:
        logger.error(f"Error fetching EudraCT data: {e}")
        return {"error": str(e), "data": None, "last_updated": datetime.utcnow().isoformat()}

def parse_eudract_text(text):
    """Parse EudraCT text download into list of trial dicts."""
    trials = []
    current_trial = {}
    current_section = None
    lines = text.splitlines()
    
    for line in lines:
        line = line.strip()
        if line.startswith("EudraCT Number:"):
            if current_trial:
                trials.append(current_trial)
            current_trial = {"EudraCT Number": line.split(":", 1)[1].strip()}
        elif line.startswith("Summary") or line in ["A. Protocol Information", "B. Sponsor Information", "D. IMP Identification", "E. General Information on the Trial", "F. Population of Trial Subjects", "N. Review by the Competent Authority or Ethics Committee in the country concerned", "P. End of Trial"]:
            current_section = line
        elif line and ':' in line:
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            current_trial[key] = value
        elif line and current_trial:  # Append to previous value if no key
            last_key = list(current_trial.keys())[-1]
            current_trial[last_key] += " " + line
    
    if current_trial:
        trials.append(current_trial)
    
    return trials

def load_eudract_data():
    """Load EudraCT data from static JSON file."""
    try:
        if not EUDRACT_CACHE.exists():
            logger.info("EudraCT cache file not found, fetching now")
            result = fetch_eudract_data()
            if result.get("error"):
                raise HTTPException(status_code=500, detail=result["error"])
            return result["data"]["studies"][:500]
        with open(EUDRACT_CACHE, "r") as f:
            data = json.load(f)
        logger.info(f"Loaded {len(data.get('data', {}).get('studies', []))} EudraCT records")
        return data["data"]["studies"][:500]  # Limit to 500 records
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding EudraCT JSON: {e}")
        raise HTTPException(status_code=500, detail="Invalid EudraCT data format")

# Initialize scheduler
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    """Run initial data fetch for both ClinicalTrials.gov and EudraCT, and start scheduler."""
    logger.info("Starting server and fetching initial data")
    try:
        # Fetch ClinicalTrials.gov
        result_ct = fetch_clinicaltrials_data()
        if result_ct.get("error"):
            logger.warning("Initial ClinicalTrials.gov fetch failed, but server will continue")
        else:
            scheduler.add_job(fetch_clinicaltrials_data, "interval", hours=24)
            scheduler.start()
            logger.info("Scheduler started for ClinicalTrials.gov data refresh every 24 hours")
        
        # Fetch EudraCT if cache missing
        if not EUDRACT_CACHE.exists():
            logger.info("EudraCT cache missing, fetching now")
            result_eu = fetch_eudract_data()
            if result_eu.get("error"):
                logger.warning("Initial EudraCT fetch failed, but server will continue")
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
    try:
        if EUDRACT_CACHE.exists():
            with open(EUDRACT_CACHE, "r") as f:
                return json.load(f)
        result = fetch_eudract_data()
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error serving EudraCT data: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving EudraCT data")

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
        eu_data = (await get_eudract())["data"].get("studies", [])
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
        eu_data = (await get_eudract())["data"].get("studies", [])
        
        # ClinicalTrials.gov conditions (list of lists)
        ct_conditions = pd.DataFrame([
            {"Condition": cond for cond in study.get("protocolSection", {})
                .get("conditionsModule", {}).get("conditions", [])}
            for study in ct_data
        ])["Condition"].value_counts().head(10).to_dict()
        
        # EudraCT conditions (single string per trial)
        eu_conditions = pd.DataFrame(eu_data)["Medical condition(s) being investigated"].value_counts().head(10).to_dict()
        
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
        eu_data = (await get_eudract())["data"].get("studies", [])
        
        ct_sponsors = pd.DataFrame([
            {"Sponsor": study.get("protocolSection", {})
                .get("sponsorCollaboratorsModule", {})
                .get("leadSponsor", {}).get("name", "Unknown")}
            for study in ct_data
        ])["Sponsor"].value_counts().head(10).to_dict()
        
        eu_sponsors = pd.DataFrame(eu_data)["Name of Sponsor"].value_counts().head(10).to_dict()
        
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
        eu_data = (await get_eudract())["data"].get("studies", [])
        
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
            enrollment_str = trial.get("F.4.2.1 In the EEA", "0")  # From trials-full.txt
            enrollment = int(enrollment_str) if enrollment_str.isdigit() else 0
            if trial.get("Trial protocol", "").endswith("Outside EU/EEA"):
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