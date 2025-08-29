import sqlite3
from pathlib import Path
import json
from datetime import datetime
import logging
from threading import Lock

logger = logging.getLogger(__name__)

# Locks for concurrent DB access
ct_lock = Lock()
eudract_lock = Lock()

def get_db_connection(db_path, wal_mode=True):
    """Create and configure SQLite connection."""
    Path(db_path).parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    if wal_mode:
        conn.execute("PRAGMA journal_mode=WAL")
    return conn

def create_tables(db_path):
    """Create tables if they don't exist."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    if 'clinical_trials' in db_path:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS clinical_trials (
                nct_id TEXT PRIMARY KEY,
                conditions TEXT,
                status TEXT,
                sponsor TEXT,
                enrollment INTEGER,
                locations TEXT,
                phases TEXT,
                start_date TEXT,
                completion_date TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_start_date ON clinical_trials(start_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_completion_date ON clinical_trials(completion_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_status ON clinical_trials(status)")
    
    if 'eudract' in db_path:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS eudract_trials (
                eudract_number TEXT PRIMARY KEY,
                condition TEXT,
                sponsor TEXT,
                enrollment INTEGER,
                start_date TEXT,
                end_date TEXT,
                trial_protocol TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_start_date ON eudract_trials(start_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_end_date ON eudract_trials(end_date)")
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    
    conn.commit()
    conn.close()

def insert_clinicaltrials_studies(studies, db_path):
    """Insert batch of ClinicalTrials.gov studies into SQLite."""
    with ct_lock:
        conn = get_db_connection(db_path)
        cursor = conn.cursor()
        try:
            for study in studies:
                protocol = study.get("protocolSection", {})
                cursor.execute("""
                    INSERT OR REPLACE INTO clinical_trials
                    (nct_id, conditions, status, sponsor, enrollment, locations, phases, start_date, completion_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    protocol.get("identificationModule", {}).get("nctId"),
                    json.dumps(protocol.get("conditionsModule", {}).get("conditions", [])),
                    protocol.get("statusModule", {}).get("overallStatus"),
                    protocol.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name"),
                    protocol.get("designModule", {}).get("enrollmentInfo", {}).get("count", 0),
                    json.dumps(protocol.get("contactsLocationsModule", {}).get("locations", [])),
                    json.dumps(protocol.get("designModule", {}).get("phases", [])),
                    protocol.get("statusModule", {}).get("startDateStruct", {}).get("date"),
                    protocol.get("statusModule", {}).get("completionDateStruct", {}).get("date")
                ))
            conn.commit()
        except sqlite3.Error as e:
            logger.error(f"SQLite insert error for ClinicalTrials.gov: {e}")
            conn.rollback()
        finally:
            conn.close()

def insert_eudract_trials(trials, db_path):
    """Insert batch of EudraCT trials into SQLite."""
    with eudract_lock:
        conn = get_db_connection(db_path)
        cursor = conn.cursor()
        try:
            for trial in trials:
                enrollment_str = trial.get("F.4.2.2 In the whole clinical trial", "0")
                try:
                    enrollment = int(enrollment_str) if enrollment_str and enrollment_str.isdigit() else 0
                except ValueError:
                    logger.warning(f"Invalid enrollment value '{enrollment_str}' for EudraCT Number {trial.get('EudraCT Number', 'unknown')}; using 0")
                    enrollment = 0
                cursor.execute("""
                    INSERT OR REPLACE INTO eudract_trials
                    (eudract_number, condition, sponsor, enrollment, start_date, end_date, trial_protocol)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    trial.get("EudraCT Number"),
                    trial.get("E.1.1 Medical condition(s) being investigated"),
                    trial.get("B.1.1 Name of Sponsor", ""),
                    enrollment,
                    trial.get("Date on which this record was first entered in the EudraCT database"),
                    trial.get("P. Date of the global end of the trial"),
                    trial.get("Trial protocol", "")
                ))
            conn.commit()
        except sqlite3.Error as e:
            logger.error(f"SQLite insert error for EudraCT: {e}")
            conn.rollback()
        finally:
            conn.close()

def get_last_updated(db_path):
    """Get last_updated timestamp from metadata."""
    return get_metadata(db_path, 'last_updated') or datetime.utcnow().isoformat()

def update_last_updated(db_path):
    """Update last_updated timestamp in metadata."""
    set_metadata(db_path, 'last_updated', datetime.utcnow().isoformat())

def get_study_count(db_path, table_name):
    """Get count of studies/trials in the table."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    conn.close()
    return count

def load_studies_from_db(db_path, table_name):
    """Load all studies from DB as list of dicts."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def parse_date_flexible(date_str):
    """Flexible date parsing for various formats."""
    formats = ["%Y-%m-%d", "%Y-%m", "%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            pass
    raise ValueError(f"Invalid date format: {date_str}")

def get_metadata(db_path, key):
    """Get a metadata value."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM metadata WHERE key = ?", (key,))
    result = cursor.fetchone()
    conn.close()
    return result['value'] if result else None

def set_metadata(db_path, key, value):
    """Set a metadata value."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()