from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional
import requests
import json
from pathlib import Path
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import sqlite3
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from db_utils import (
    create_tables, insert_clinicaltrials_studies, insert_eudract_trials,
    get_last_updated, update_last_updated, get_study_count,
    load_studies_from_db, parse_date_flexible, get_db_connection,
    get_metadata, set_metadata
)

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

# DB paths
CLINICALTRIALS_DB = Path("data/clinical_trials.db")
EUDRACT_DB = Path("data/eudract.db")

# Create tables on startup
create_tables(str(CLINICALTRIALS_DB))
create_tables(str(EUDRACT_DB))

def fetch_clinicaltrials_data():
    """Fetch all data from ClinicalTrials.gov API and store in SQLite, resumable with last_token."""
    try:
        fetch_complete = get_metadata(str(CLINICALTRIALS_DB), 'fetch_complete')
        if fetch_complete == 'yes':
            logger.info("ClinicalTrials.gov fetch is complete; skipping.")
            return {"data": {"studies": []}, "last_updated": get_last_updated(str(CLINICALTRIALS_DB))}

        url = "https://clinicaltrials.gov/api/v2/studies"
        params = {
            "pageSize": 1000,
            "fields": (
                "protocolSection.identificationModule.nctId,"
                "protocolSection.conditionsModule.conditions,"
                "protocolSection.statusModule.overallStatus,"
                "protocolSection.sponsorCollaboratorsModule.leadSponsor.name,"
                "protocolSection.designModule.enrollmentInfo.count,"
                "protocolSection.contactsLocationsModule.locations,"
                "protocolSection.designModule.phases,"
                "protocolSection.statusModule.startDateStruct,"
                "protocolSection.statusModule.completionDateStruct"
            )
        }
        last_token = get_metadata(str(CLINICALTRIALS_DB), 'last_token')
        logger.info(f"Starting/resuming ClinicalTrials.gov fetch from token: {last_token}")

        total_fetched = 0
        next_token = last_token
        while True:
            if next_token:
                params["pageToken"] = next_token
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            studies = data.get('studies', [])
            if not studies:
                set_metadata(str(CLINICALTRIALS_DB), 'fetch_complete', 'yes')
                set_metadata(str(CLINICALTRIALS_DB), 'last_token', None)
                break
            insert_clinicaltrials_studies(studies, str(CLINICALTRIALS_DB))
            total_fetched += len(studies)
            logger.info(f"Fetched {len(studies)} ClinicalTrials.gov studies (total new: {total_fetched})")
            next_token = data.get('nextPageToken')
            set_metadata(str(CLINICALTRIALS_DB), 'last_token', next_token)
            if not next_token:
                set_metadata(str(CLINICALTRIALS_DB), 'fetch_complete', 'yes')
                break
            time.sleep(0.2)
        
        update_last_updated(str(CLINICALTRIALS_DB))
        logger.info(f"Completed/resumed fetching {total_fetched} new ClinicalTrials.gov records")
        return {"data": {"studies": []}, "last_updated": get_last_updated(str(CLINICALTRIALS_DB))}
    except requests.RequestException as e:
        logger.error(f"Error fetching ClinicalTrials.gov data: {e}")
        return {"error": str(e), "data": None, "last_updated": datetime.utcnow().isoformat()}

def fetch_eudract_page(page, session):
    """Fetch and parse a single EudraCT page."""
    try:
        search_url = f"https://www.clinicaltrialsregister.eu/ctr-search/search?query=&page={page}"
        search_response = session.get(search_url, timeout=10)
        search_response.raise_for_status()
        logger.info(f"Loaded search page {page}: Status {search_response.status_code}")

        download_url = "https://www.clinicaltrialsregister.eu/ctr-search/rest/download/full?query=&mode=current_page"
        download_response = session.get(download_url, timeout=10)
        download_response.raise_for_status()
        text = download_response.text
        
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
        elif line and current_trial:
            last_key = list(current_trial.keys())[-1]
            current_trial[last_key] += " " + line
    
    if current_trial:
        trials.append(current_trial)
    
    return trials

def fetch_eudract_data(batch_size=10):
    """Fetch all EudraCT data, resumable, until no more pages."""
    try:
        fetch_complete = get_metadata(str(EUDRACT_DB), 'fetch_complete')
        if fetch_complete == 'yes':
            logger.info("EudraCT fetch is complete; skipping.")
            return {"data": {"studies": []}, "last_updated": get_last_updated(str(EUDRACT_DB))}

        trials_per_page = 20
        last_page = get_metadata(str(EUDRACT_DB), 'last_page')
        start_page = int(last_page) + 1 if last_page else 1
        logger.info(f"Resuming EudraCT fetch from page {start_page}")

        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.clinicaltrialsregister.eu/ctr-search/search',
        })

        all_new_trials = []
        page = start_page
        with ThreadPoolExecutor(max_workers=batch_size) as executor:
            while True:
                batch_pages = list(range(page, page + batch_size))
                logger.info(f"Fetching batch of pages: {batch_pages}")
                
                futures = [executor.submit(fetch_eudract_page, p, session) for p in batch_pages]
                batch_trials = []
                for future in as_completed(futures):
                    page_trials = future.result()
                    if not page_trials:
                        set_metadata(str(EUDRACT_DB), 'fetch_complete', 'yes')
                        set_metadata(str(EUDRACT_DB), 'last_page', str(page - 1))
                        break
                    batch_trials.extend(page_trials)
                    insert_eudract_trials(page_trials, str(EUDRACT_DB))
                
                all_new_trials.extend(batch_trials)
                if not batch_trials:
                    break
                
                set_metadata(str(EUDRACT_DB), 'last_page', str(page + batch_size - 1))
                page += batch_size
                time.sleep(3)
        
        update_last_updated(str(EUDRACT_DB))
        logger.info(f"Fetched and stored {len(all_new_trials)} new EudraCT records")
        return {"data": {"studies": []}, "last_updated": get_last_updated(str(EUDRACT_DB))}
    except Exception as e:
        logger.error(f"Error fetching EudraCT data: {e}")
        return {"error": str(e), "data": None, "last_updated": datetime.utcnow().isoformat()}

async def get_clinicaltrials():
    """Get ClinicalTrials.gov data from SQLite."""
    studies = load_studies_from_db(str(CLINICALTRIALS_DB), "clinical_trials")
    return {"data": {"studies": studies}, "last_updated": get_last_updated(str(CLINICALTRIALS_DB))}

async def get_eudract():
    """Get EudraCT data from SQLite."""
    studies = load_studies_from_db(str(EUDRACT_DB), "eudract_trials")
    return {"data": {"studies": studies}, "last_updated": get_last_updated(str(EUDRACT_DB))}

@app.get("/clinicaltrials")
async def get_clinicaltrials_endpoint():
    """Retrieve cached ClinicalTrials.gov data."""
    try:
        studies = load_studies_from_db(str(CLINICALTRIALS_DB), "clinical_trials")
        return {"data": {"studies": studies}, "last_updated": get_last_updated(str(CLINICALTRIALS_DB))}
    except Exception as e:
        logger.error(f"Error serving ClinicalTrials.gov data: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving ClinicalTrials.gov data")

@app.get("/eudract")
async def get_eudract_endpoint():
    """Retrieve cached EudraCT data."""
    try:
        studies = load_studies_from_db(str(EUDRACT_DB), "eudract_trials")
        return {"data": {"studies": studies}, "last_updated": get_last_updated(str(EUDRACT_DB))}
    except Exception as e:
        logger.error(f"Error serving EudraCT data: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving EudraCT data")

@app.post("/refresh")
async def refresh_data():
    """Manually ClinicalTrials.gov data."""
    try:
        # Reset fetch status
        set_metadata(str(CLINICALTRIALS_DB), 'fetch_complete', None)
        
        result_ct = fetch_clinicaltrials_data()
        
        if result_ct.get("error"):
            raise HTTPException(status_code=500, detail="Error during refresh: " + result_ct.get("error"))
        
        return {
            "status": "Data refreshed",
            "clinicaltrials_records": get_study_count(str(CLINICALTRIALS_DB), "clinical_trials"),
            "last_updated": get_last_updated(str(CLINICALTRIALS_DB))
        }
    except Exception as e:
        logger.error(f"Error refreshing data: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh data")

@app.get("/aggregations/totals")
async def get_totals(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Get total number of trials from both sources with optional filters."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = "SELECT COUNT(*) FROM clinical_trials WHERE 1=1"
        eu_query = "SELECT COUNT(*) FROM eudract_trials WHERE 1=1"
        params_ct = []
        params_eu = []

        if start_date:
            ct_query += " AND start_date >= ?"
            eu_query += " AND start_date >= ?"
            params_ct.append(start_date)
            params_eu.append(start_date)
        if end_date:
            ct_query += " AND completion_date <= ?"
            eu_query += " AND end_date <= ?"
            params_ct.append(end_date)
            params_eu.append(end_date)
        if conditions:
            for cond in conditions:
                ct_query += " AND conditions LIKE ?"
                params_ct.append(f"%{cond}%")
                eu_query += " AND condition LIKE ?"
                params_eu.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States')"
                eu_query += " AND EXISTS (SELECT 1 WHERE 0)"  # No US trials in EudraCT
            elif region == "EU":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN ('Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'))"
                eu_query += " AND 1=1"  # EudraCT is EU-only

        ct_cursor.execute(ct_query, params_ct)
        eu_cursor.execute(eu_query, params_eu)
        ct_total = ct_cursor.fetchone()[0]
        eu_total = eu_cursor.fetchone()[0]

        ct_conn.close()
        eu_conn.close()

        return {
            "clinicaltrials_total": ct_total,
            "eudract_total": eu_total
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in totals: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating totals: {str(e)}")
        raise HTTPException(status_code=500, detail="Error calculating totals")

@app.get("/aggregations/by_condition")
async def get_by_condition(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Aggregate trials by condition with optional filters."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = """
            SELECT json_extract(value, '$') as cond, COUNT(*) as count
            FROM clinical_trials, json_each(conditions)
            WHERE cond IS NOT NULL AND cond != ''
        """
        eu_query = """
            SELECT condition as cond, COUNT(*) as count
            FROM eudract_trials
            WHERE condition IS NOT NULL AND condition != ''
        """
        params_ct = []
        params_eu = []

        if start_date:
            ct_query += " AND start_date >= ?"
            eu_query += " AND start_date >= ?"
            params_ct.append(start_date)
            params_eu.append(start_date)
        if end_date:
            ct_query += " AND completion_date <= ?"
            eu_query += " AND end_date <= ?"
            params_ct.append(end_date)
            params_eu.append(end_date)
        if conditions:
            for cond in conditions:
                ct_query += " AND conditions LIKE ?"
                params_ct.append(f"%{cond}%")
                eu_query += " AND condition LIKE ?"
                params_eu.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States')"
                eu_query += " AND EXISTS (SELECT 1 WHERE 0)"
            elif region == "EU":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN ('Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'))"
                eu_query += " AND 1=1"

        ct_query += " GROUP BY cond ORDER BY count DESC LIMIT 10"
        eu_query += " GROUP BY cond ORDER BY count DESC LIMIT 10"

        ct_cursor.execute(ct_query, params_ct)
        eu_cursor.execute(eu_query, params_eu)
        ct_conditions = dict(ct_cursor.fetchall())
        eu_conditions = dict(eu_cursor.fetchall())

        ct_conn.close()
        eu_conn.close()

        return {
            "clinicaltrials_conditions": ct_conditions,
            "eudract_conditions": eu_conditions
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in by_condition: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error aggregating by condition: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by condition: {str(e)}")

@app.get("/aggregations/by_sponsor")
async def get_by_sponsor(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Aggregate trials by sponsor (top 10) with optional filters."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = """
            SELECT sponsor as sponsor, COUNT(*) as count
            FROM clinical_trials
            WHERE sponsor IS NOT NULL AND sponsor != ''
        """
        eu_query = """
            SELECT sponsor as sponsor, COUNT(*) as count
            FROM eudract_trials
            WHERE sponsor IS NOT NULL AND sponsor != ''
        """
        params_ct = []
        params_eu = []

        if start_date:
            ct_query += " AND start_date >= ?"
            eu_query += " AND start_date >= ?"
            params_ct.append(start_date)
            params_eu.append(start_date)
        if end_date:
            ct_query += " AND completion_date <= ?"
            eu_query += " AND end_date <= ?"
            params_ct.append(end_date)
            params_eu.append(end_date)
        if conditions:
            for cond in conditions:
                ct_query += " AND conditions LIKE ?"
                params_ct.append(f"%{cond}%")
                eu_query += " AND condition LIKE ?"
                params_eu.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States')"
                eu_query += " AND EXISTS (SELECT 1 WHERE 0)"
            elif region == "EU":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN ('Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'))"
                eu_query += " AND 1=1"

        ct_query += " GROUP BY sponsor ORDER BY count DESC LIMIT 10"
        eu_query += " GROUP BY sponsor ORDER BY count DESC LIMIT 10"

        ct_cursor.execute(ct_query, params_ct)
        eu_cursor.execute(eu_query, params_eu)
        ct_sponsors = dict(ct_cursor.fetchall())
        eu_sponsors = dict(eu_cursor.fetchall())

        ct_conn.close()
        eu_conn.close()

        return {
            "clinicaltrials_sponsors": ct_sponsors,
            "eudract_sponsors": eu_sponsors
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in by_sponsor: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error aggregating by sponsor: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by sponsor: {str(e)}")

@app.get("/aggregations/enrollment_by_region")
async def get_enrollment_by_region(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Aggregate enrollment totals by region (US, EU, Others) with optional filters."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        eu_countries = [
            "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
            "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland",
            "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
            "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"
        ]

        ct_query = """
            SELECT
                CASE
                    WHEN EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States') THEN 'US'
                    WHEN EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN (%s)) THEN 'EU'
                    ELSE 'Others'
                END as region,
                SUM(enrollment) as total
            FROM clinical_trials
            WHERE 1=1
        """ % ",".join(["?"] * len(eu_countries))
        eu_query = """
            SELECT
                CASE
                    WHEN trial_protocol LIKE '%Outside EU/EEA' THEN 'Others'
                    ELSE 'EU'
                END as region,
                SUM(enrollment) as total
            FROM eudract_trials
            WHERE 1=1
        """
        params_ct = eu_countries[:]
        params_eu = []

        if start_date:
            ct_query += " AND start_date >= ?"
            eu_query += " AND start_date >= ?"
            params_ct.append(start_date)
            params_eu.append(start_date)
        if end_date:
            ct_query += " AND completion_date <= ?"
            eu_query += " AND end_date <= ?"
            params_ct.append(end_date)
            params_eu.append(end_date)
        if conditions:
            for cond in conditions:
                ct_query += " AND conditions LIKE ?"
                params_ct.append(f"%{cond}%")
                eu_query += " AND condition LIKE ?"
                params_eu.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States')"
                eu_query += " AND EXISTS (SELECT 1 WHERE 0)"
            elif region == "EU":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN (%s))" % ",".join(["?"] * len(eu_countries))
                params_ct.extend(eu_countries)
                eu_query += " AND 1=1"

        ct_query += " GROUP BY region"
        eu_query += " GROUP BY region"

        ct_cursor.execute(ct_query, params_ct)
        eu_cursor.execute(eu_query, params_eu)
        ct_enrollment = dict(ct_cursor.fetchall())
        eu_enrollment = dict(eu_cursor.fetchall())

        # Ensure all regions are present
        regions = ["US", "EU", "Others"]
        ct_enrollment = {r: ct_enrollment.get(r, 0) for r in regions}
        eu_enrollment = {r: eu_enrollment.get(r, 0) for r in regions}

        ct_conn.close()
        eu_conn.close()

        return {
            "clinicaltrials_enrollment": ct_enrollment,
            "eudract_enrollment": eu_enrollment
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in enrollment_by_region: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error aggregating enrollment by region: {str(e)}")
        raise HTTPException(status_code=500, detail="Error aggregating enrollment by region")

@app.get("/aggregations/by_status")
async def get_by_status(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Aggregate trials by status with optional filters."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = """
            SELECT status, COUNT(*) as count
            FROM clinical_trials
            WHERE status IS NOT NULL AND status != ''
        """
        eu_query = """
            SELECT "P. End of Trial Status" as status, COUNT(*) as count
            FROM eudract_trials
            WHERE "P. End of Trial Status" IS NOT NULL AND "P. End of Trial Status" != ''
        """
        params_ct = []
        params_eu = []

        if start_date:
            ct_query += " AND start_date >= ?"
            eu_query += " AND start_date >= ?"
            params_ct.append(start_date)
            params_eu.append(start_date)
        if end_date:
            ct_query += " AND completion_date <= ?"
            eu_query += " AND end_date <= ?"
            params_ct.append(end_date)
            params_eu.append(end_date)
        if conditions:
            for cond in conditions:
                ct_query += " AND conditions LIKE ?"
                params_ct.append(f"%{cond}%")
                eu_query += " AND condition LIKE ?"
                params_eu.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States')"
                eu_query += " AND EXISTS (SELECT 1 WHERE 0)"
            elif region == "EU":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN ('Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'))"
                eu_query += " AND 1=1"

        ct_query += " GROUP BY status"
        eu_query += " GROUP BY status"

        ct_cursor.execute(ct_query, params_ct)
        eu_cursor.execute(eu_query, params_eu)
        ct_statuses = dict(ct_cursor.fetchall())
        eu_statuses = dict(eu_cursor.fetchall())

        ct_conn.close()
        eu_conn.close()

        return {
            "clinicaltrials_statuses": ct_statuses,
            "eudract_statuses": eu_statuses
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in by_status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error aggregating by status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by status: {str(e)}")

@app.get("/aggregations/by_phase")
async def get_by_phase(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Aggregate trials by phase with optional filters."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = """
            SELECT json_extract(value, '$') as phase, COUNT(*) as count
            FROM clinical_trials, json_each(phases)
            WHERE phase IS NOT NULL AND phase != ''
        """
        eu_query = """
            SELECT CASE
                WHEN "A.3 Full title of the trial" LIKE '%Phase I%' THEN 'Phase I'
                WHEN "A.3 Full title of the trial" LIKE '%Phase II%' THEN 'Phase II'
                WHEN "A.3 Full title of the trial" LIKE '%Phase III%' THEN 'Phase III'
                WHEN "A.3 Full title of the trial" LIKE '%Phase IV%' THEN 'Phase IV'
                ELSE NULL
            END as phase, COUNT(*) as count
            FROM eudract_trials
            WHERE phase IS NOT NULL
        """
        params_ct = []
        params_eu = []

        if start_date:
            ct_query += " AND start_date >= ?"
            eu_query += " AND start_date >= ?"
            params_ct.append(start_date)
            params_eu.append(start_date)
        if end_date:
            ct_query += " AND completion_date <= ?"
            eu_query += " AND end_date <= ?"
            params_ct.append(end_date)
            params_eu.append(end_date)
        if conditions:
            for cond in conditions:
                ct_query += " AND conditions LIKE ?"
                params_ct.append(f"%{cond}%")
                eu_query += " AND condition LIKE ?"
                params_eu.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States')"
                eu_query += " AND EXISTS (SELECT 1 WHERE 0)"
            elif region == "EU":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN ('Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'))"
                eu_query += " AND 1=1"

        ct_query += " GROUP BY phase"
        eu_query += " GROUP BY phase"

        ct_cursor.execute(ct_query, params_ct)
        eu_cursor.execute(eu_query, params_eu)
        ct_phases = dict(ct_cursor.fetchall())
        eu_phases = dict(eu_cursor.fetchall())

        # Normalize phases
        phases = ["Phase I", "Phase II", "Phase III", "Phase IV"]
        ct_phases_normalized = {p: ct_phases.get(p, 0) for p in phases}
        eu_phases_normalized = {p: eu_phases.get(p, 0) for p in phases}

        ct_conn.close()
        eu_conn.close()

        return {
            "clinicaltrials_phases": ct_phases_normalized,
            "eudract_phases": eu_phases_normalized
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in by_phase: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error aggregating by phase: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by phase: {str(e)}")

@app.get("/aggregations/by_year")
async def get_by_year(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Aggregate cumulative enrollment by year with optional filters."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = """
            SELECT strftime('%Y', start_date) as year, SUM(enrollment) as total
            FROM clinical_trials
            WHERE start_date IS NOT NULL
        """
        eu_query = """
            SELECT strftime('%Y', start_date) as year, SUM(enrollment) as total
            FROM eudract_trials
            WHERE start_date IS NOT NULL
        """
        params_ct = []
        params_eu = []

        if start_date:
            ct_query += " AND start_date >= ?"
            eu_query += " AND start_date >= ?"
            params_ct.append(start_date)
            params_eu.append(start_date)
        if end_date:
            ct_query += " AND completion_date <= ?"
            eu_query += " AND end_date <= ?"
            params_ct.append(end_date)
            params_eu.append(end_date)
        if conditions:
            for cond in conditions:
                ct_query += " AND conditions LIKE ?"
                params_ct.append(f"%{cond}%")
                eu_query += " AND condition LIKE ?"
                params_eu.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States')"
                eu_query += " AND EXISTS (SELECT 1 WHERE 0)"
            elif region == "EU":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN ('Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'))"
                eu_query += " AND 1=1"

        ct_query += " GROUP BY year"
        eu_query += " GROUP BY year"

        ct_cursor.execute(ct_query, params_ct)
        eu_cursor.execute(eu_query, params_eu)
        ct_years = dict(ct_cursor.fetchall())
        eu_years = dict(eu_cursor.fetchall())

        all_years = sorted(set(list(ct_years.keys()) + list(eu_years.keys())))
        ct_data_sorted = {year: ct_years.get(year, 0) for year in all_years}
        eu_data_sorted = {year: eu_years.get(year, 0) for year in all_years}

        ct_conn.close()
        eu_conn.close()

        return {
            "clinicaltrials_years": ct_data_sorted,
            "eudract_years": eu_data_sorted
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in by_year: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error aggregating by year: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by year: {str(e)}")

@app.get("/aggregations/by_country")
async def get_by_country(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Aggregate trials by country (top 10) for ClinicalTrials.gov with optional filters."""
    try:
        conn = get_db_connection(str(CLINICALTRIALS_DB))
        cursor = conn.cursor()
        query = """
            SELECT json_extract(value, '$.country') as country, COUNT(*) as count
            FROM clinical_trials, json_each(locations)
            WHERE country IS NOT NULL AND country != ''
        """
        params = []
        if start_date:
            query += " AND start_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND completion_date <= ?"
            params.append(end_date)
        if conditions:
            for cond in conditions:
                query += " AND conditions LIKE ?"
                params.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                query += " AND json_extract(value, '$.country') = 'United States'"
            elif region == "EU":
                query += " AND json_extract(value, '$.country') IN ('Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden')"

        query += " GROUP BY country ORDER BY count DESC LIMIT 10"

        cursor.execute(query, params)
        ct_countries = dict(cursor.fetchall())
        conn.close()

        return {"clinicaltrials_countries": ct_countries}
    except sqlite3.Error as e:
        logger.error(f"SQLite error in by_country: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error aggregating by country: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by country: {str(e)}")

@app.get("/conditions")
async def get_conditions():
    """Get all unique conditions from both ClinicalTrials.gov and EudraCT data."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = """
            SELECT DISTINCT json_extract(value, '$') as cond
            FROM clinical_trials, json_each(conditions)
            WHERE cond IS NOT NULL AND cond != ''
        """
        eu_query = """
            SELECT DISTINCT condition as cond
            FROM eudract_trials
            WHERE condition IS NOT NULL AND condition != ''
        """
        ct_cursor.execute(ct_query)
        eu_cursor.execute(eu_query)
        ct_conditions = {row['cond'].strip() for row in ct_cursor.fetchall()}
        eu_conditions = {row['cond'].strip() for row in eu_cursor.fetchall()}

        ct_conn.close()
        eu_conn.close()

        all_conditions = sorted(ct_conditions.union(eu_conditions))
        
        return {
            "conditions": all_conditions,
            "total_count": len(all_conditions)
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in conditions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting conditions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting conditions: {str(e)}")

@app.get("/min_max_date")
async def get_min_and_max_date():
    """Get min/max dates using SQL."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = """
            SELECT MIN(start_date), MAX(completion_date)
            FROM clinical_trials
            WHERE start_date IS NOT NULL
        """
        eu_query = """
            SELECT MIN(start_date), MAX(end_date)
            FROM eudract_trials
            WHERE start_date IS NOT NULL
        """
        ct_cursor.execute(ct_query)
        eu_cursor.execute(eu_query)
        ct_min, ct_max = ct_cursor.fetchone()
        eu_min, eu_max = eu_cursor.fetchone()

        ct_conn.close()
        eu_conn.close()

        all_dates = [d for d in [ct_min, ct_max, eu_min, eu_max] if d]
        if not all_dates:
            return {"min_date": None, "max_date": None}
        
        return {
            "min_date": min(all_dates),
            "max_date": max(all_dates)
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in min_max_date: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting min/max dates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting min/max dates: {str(e)}")

@app.get("/aggregations/by_duration")
async def get_by_duration(
    region: Optional[str] = Query(None, description="Filter by region: US, EU, or ALL"),
    conditions: Optional[List[str]] = Query(None, description="Filter by conditions"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)")
):
    """Aggregate trials by duration bins using SQL."""
    try:
        ct_conn = get_db_connection(str(CLINICALTRIALS_DB))
        eu_conn = get_db_connection(str(EUDRACT_DB))
        ct_cursor = ct_conn.cursor()
        eu_cursor = eu_conn.cursor()

        ct_query = """
            SELECT CASE
                WHEN months < 12 THEN '<1 year'
                WHEN months < 24 THEN '1-2 years'
                WHEN months < 36 THEN '2-3 years'
                WHEN months < 60 THEN '3-5 years'
                ELSE '>5 years'
            END as bin, COUNT(*) as count
            FROM (
                SELECT (strftime('%Y', completion_date) - strftime('%Y', start_date)) * 12 +
                       (strftime('%m', completion_date) - strftime('%m', start_date)) as months
                FROM clinical_trials
                WHERE start_date IS NOT NULL AND completion_date IS NOT NULL
            )
            WHERE 1=1
        """
        eu_query = """
            SELECT CASE
                WHEN months < 12 THEN '<1 year'
                WHEN months < 24 THEN '1-2 years'
                WHEN months < 36 THEN '2-3 years'
                WHEN months < 60 THEN '3-5 years'
                ELSE '>5 years'
            END as bin, COUNT(*) as count
            FROM (
                SELECT (strftime('%Y', end_date) - strftime('%Y', start_date)) * 12 +
                       (strftime('%m', end_date) - strftime('%m', start_date)) as months
                FROM eudract_trials
                WHERE start_date IS NOT NULL AND end_date IS NOT NULL
            )
            WHERE 1=1
        """
        params_ct = []
        params_eu = []
        if start_date:
            ct_query += " AND start_date >= ?"
            eu_query += " AND start_date >= ?"
            params_ct.append(start_date)
            params_eu.append(start_date)
        if end_date:
            ct_query += " AND completion_date <= ?"
            eu_query += " AND end_date <= ?"
            params_ct.append(end_date)
            params_eu.append(end_date)
        if conditions:
            for cond in conditions:
                ct_query += " AND conditions LIKE ?"
                params_ct.append(f"%{cond}%")
                eu_query += " AND condition LIKE ?"
                params_eu.append(f"%{cond}%")
        if region and region != "ALL":
            if region == "US":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' = 'United States')"
                eu_query += " AND EXISTS (SELECT 1 WHERE 0)"
            elif region == "EU":
                ct_query += " AND EXISTS (SELECT 1 FROM json_each(locations) WHERE value->>'country' IN ('Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'))"
                eu_query += " AND 1=1"

        ct_query += " GROUP BY bin"
        eu_query += " GROUP BY bin"

        ct_cursor.execute(ct_query, params_ct)
        eu_cursor.execute(eu_query, params_eu)
        ct_durations = dict(ct_cursor.fetchall())
        eu_durations = dict(eu_cursor.fetchall())

        bins = ["<1 year", "1-2 years", "2-3 years", "3-5 years", ">5 years"]
        ct_durations = {b: ct_durations.get(b, 0) for b in bins}
        eu_durations = {b: eu_durations.get(b, 0) for b in bins}

        ct_conn.close()
        eu_conn.close()

        return {
            "clinicaltrials_durations": ct_durations,
            "eudract_durations": eu_durations
        }
    except sqlite3.Error as e:
        logger.error(f"SQLite error in by_duration: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error aggregating by duration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error aggregating by duration: {str(e)}")

# Initialize scheduler
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    """Run data fetches on app startup."""
    logger.info("Starting initial data fetch on app startup")
    fetch_clinicaltrials_data()
    fetch_eudract_data()

# Scheduler for periodic updates
scheduler.add_job(fetch_clinicaltrials_data, 'interval', hours=24)
scheduler.start()