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
from concurrent.futures import ThreadPoolExecutor, as_completed

# Global configuration
NUM_TRIALS = 500

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
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

def fetch_clinicaltrials_data(limit=NUM_TRIALS):
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

def fetch_eudract_page(page, session):
    """Fetch and parse a single EudraCT page."""
    try:
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
        logger.info(f"Fetched {len(page_trials)} trials from page {page}")
        return page_trials
    except Exception as e:
        logger.error(f"Error fetching EudraCT page {page}: {e}")
        return []

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
        elif line.startswith("Summary") or line in [
            "A. Protocol Information",
            "B. Sponsor Information",
            "D. IMP Identification",
            "E. General Information on the Trial",
            "F. Population of Trial Subjects",
            "N. Review by the Competent Authority or Ethics Committee in the country concerned",
            "P. End of Trial"
        ]:
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

def fetch_eudract_data(limit=NUM_TRIALS, batch_size=5, start_page=1):
    """Spoof EudraCT download: Fetch and parse full details for {NUM_TRIALS} trials, resumable."""
    try:
        trials_per_page = 20
        total_pages_needed = (limit + trials_per_page - 1) // trials_per_page
        
        # Load existing cache to resume
        existing_trials = []
        last_updated = datetime.utcnow().isoformat()
        if EUDRACT_CACHE.exists():
            try:
                with open(EUDRACT_CACHE, "r") as f:
                    cache_data = json.load(f)
                    existing_trials = cache_data.get("data", {}).get("studies", [])
                    last_updated = cache_data.get("last_updated", last_updated)
                logger.info(f"Loaded {len(existing_trials)} existing EudraCT trials from cache")
            except json.JSONDecodeError as e:
                logger.error(f"Error reading EudraCT cache: {e}")
                existing_trials = []
        
        if len(existing_trials) >= limit:
            logger.info("Cache already has sufficient trials; no fetch needed")
            return {"data": {"studies": existing_trials[:limit]}, "last_updated": last_updated}
        
        remaining_trials_needed = limit - len(existing_trials)
        remaining_pages_needed = (remaining_trials_needed + trials_per_page - 1) // trials_per_page
        start_page = max(start_page, (len(existing_trials) // trials_per_page) + 1)
        
        logger.info(f"Resuming EudraCT fetch from page {start_page}; need {remaining_pages_needed} more pages")

        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.clinicaltrialsregister.eu/ctr-search/search',
        })

        all_new_trials = []
        with ThreadPoolExecutor(max_workers=batch_size) as executor:
            for batch_start in range(0, remaining_pages_needed, batch_size):
                batch_end = min(batch_start + batch_size, remaining_pages_needed)
                batch_pages = list(range(start_page + batch_start, start_page + batch_end))
                logger.info(f"Fetching batch of pages: {batch_pages}")
                
                futures = [executor.submit(fetch_eudract_page, page, session) for page in batch_pages]
                for future in as_completed(futures):
                    page_trials = future.result()
                    all_new_trials.extend(page_trials)
                    
                    # Append chunk to cache
                    existing_trials.extend(page_trials)
                    EUDRACT_CACHE.parent.mkdir(exist_ok=True)
                    data_with_timestamp = {
                        "data": {"studies": existing_trials},
                        "last_updated": datetime.utcnow().isoformat()
                    }
                    with open(EUDRACT_CACHE, "w") as f:
                        json.dump(data_with_timestamp, f)
                    logger.info(f"Appended {len(page_trials)} trials to cache (total now: {len(existing_trials)})")
                
                if len(existing_trials) >= limit:
                    existing_trials = existing_trials[:limit]
                    break
                
                time.sleep(3)  # Batch-level delay to avoid rate limiting
        
        logger.info(f"Fetched and cached {len(all_new_trials)} new EudraCT records (total: {len(existing_trials)})")
        return {"data": {"studies": existing_trials[:limit]}, "last_updated": last_updated}
    except Exception as e:
        logger.error(f"Error fetching EudraCT data: {e}")
        return {"error": str(e), "data": None, "last_updated": datetime.utcnow().isoformat()}

def load_eudract_data():
    """Load EudraCT data from static JSON file."""
    try:
        if not EUDRACT_CACHE.exists():
            logger.warning("EudraCT cache file not found, fetching now")
            result = fetch_eudract_data()
            if result.get("error"):
                raise HTTPException(status_code=500, detail=result["error"])
            return result["data"]["studies"][:NUM_TRIALS]
        with open(EUDRACT_CACHE, "r") as f:
            data = json.load(f)
        logger.info(f"Loaded {len(data.get('data', {}).get('studies', []))} EudraCT records")
        return data["data"]["studies"][:NUM_TRIALS]
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding EudraCT JSON: {e}")
        raise HTTPException(status_code=500, detail="Invalid EudraCT data format")

# Initialize scheduler
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    """Run initial data fetch for both ClinicalTrials.gov and EudraCT."""
    logger.info("Starting server and fetching initial data")
    try:
        # Fetch ClinicalTrials.gov
        logger.info("Starting ClinicalTrials.gov fetch")
        result_ct = fetch_clinicaltrials_data()
        if result_ct.get("error"):
            logger.warning("Initial ClinicalTrials.gov fetch failed, but server will continue")
        else:
            scheduler.add_job(fetch_clinicaltrials_data, "interval", hours=24)
            scheduler.start()
            logger.info("Scheduler started for ClinicalTrials.gov data refresh every 24 hours")
        
        # Fetch EudraCT if cache missing or incomplete
        logger.info("Checking EudraCT cache")
        existing_trials = []
        if EUDRACT_CACHE.exists():
            try:
                with open(EUDRACT_CACHE, "r") as f:
                    cache_data = json.load(f)
                    existing_trials = cache_data.get("data", {}).get("studies", [])
                logger.info(f"EudraCT cache found with {len(existing_trials)} trials")
            except json.JSONDecodeError as e:
                logger.error(f"Error reading EudraCT cache: {e}")
                existing_trials = []
        
        if len(existing_trials) < NUM_TRIALS:
            logger.info(f"EudraCT cache incomplete ({len(existing_trials)} trials), starting fetch from page {(len(existing_trials) // 20) + 1}")
            result_eu = fetch_eudract_data(limit=NUM_TRIALS, start_page=(len(existing_trials) // 20) + 1)
            if result_eu.get("error"):
                logger.warning("Initial EudraCT fetch failed, but server will continue")
            else:
                logger.info("EudraCT fetch completed successfully")
        else:
            logger.info("EudraCT cache has sufficient trials, skipping fetch")
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
        
        # ClinicalTrials.gov conditions
        ct_conditions = {}
        for study in ct_data:
            conditions = study.get("protocolSection", {}).get("conditionsModule", {}).get("conditions", [])
            for cond in conditions:
                if cond and isinstance(cond, str) and cond.strip():  # Ensure valid condition
                    ct_conditions[cond] = ct_conditions.get(cond, 0) + 1
        ct_conditions = dict(sorted(ct_conditions.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # EudraCT conditions
        eu_conditions = {}
        for trial in eu_data:
            condition = trial.get("E.1.1 Medical condition(s) being investigated", None)
            if condition and isinstance(condition, str) and condition.strip():  # Ensure valid condition
                eu_conditions[condition] = eu_conditions.get(condition, 0) + 1
            else:
                logger.debug(f"Skipping trial {trial.get('EudraCT Number', 'unknown')} due to missing or invalid condition")
        eu_conditions = dict(sorted(eu_conditions.items(), key=lambda x: x[1], reverse=True)[:10])
        
        return {
            "clinicaltrials_conditions": ct_conditions,
            "eudract_conditions": eu_conditions
        }
    except Exception as e:
        logger.error(f"Error aggregating by condition: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by condition: {str(e)}")

@app.get("/aggregations/by_sponsor")
async def get_by_sponsor():
    """Aggregate trials by sponsor (top 10)."""
    try:
        ct_data = (await get_clinicaltrials())["data"].get("studies", [])
        eu_data = (await get_eudract())["data"].get("studies", [])
        
        # ClinicalTrials.gov sponsors
        ct_sponsors = {}
        for study in ct_data:
            sponsor = study.get("protocolSection", {}).get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name", "Unknown")
            if sponsor and isinstance(sponsor, str) and sponsor.strip():  # Ensure valid sponsor
                ct_sponsors[sponsor] = ct_sponsors.get(sponsor, 0) + 1
        ct_sponsors = dict(sorted(ct_sponsors.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # EudraCT sponsors
        eu_sponsors = {}
        for trial in eu_data:
            sponsor = trial.get("B.1.1 Name of Sponsor", "Unknown")
            if sponsor and isinstance(sponsor, str) and sponsor.strip():  # Ensure valid sponsor
                eu_sponsors[sponsor] = eu_sponsors.get(sponsor, 0) + 1
            else:
                logger.debug(f"Skipping trial {trial.get('EudraCT Number', 'unknown')} due to missing or invalid sponsor")
        eu_sponsors = dict(sorted(eu_sponsors.items(), key=lambda x: x[1], reverse=True)[:10])
        
        return {
            "clinicaltrials_sponsors": ct_sponsors,
            "eudract_sponsors": eu_sponsors
        }
    except Exception as e:
        logger.error(f"Error aggregating by sponsor: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by sponsor: {str(e)}")

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
            enrollment_str = trial.get("F.4.2.1 In the EEA", "0")
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