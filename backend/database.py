import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from models import ClinicalTrial, EudraCTRecord

class Database:
    def __init__(self, db_path: str = "miracle.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database and create tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create clinical trials table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS clinical_trials (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL,
                phase TEXT,
                sponsor TEXT NOT NULL,
                start_date TEXT,
                completion_date TEXT,
                enrollment INTEGER,
                conditions TEXT,
                interventions TEXT,
                locations TEXT,
                source TEXT NOT NULL,
                last_updated TEXT NOT NULL
            )
        ''')
        
        # Create EudraCT table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS eudract_records (
                eudract_number TEXT PRIMARY KEY,
                sponsor_protocol_number TEXT,
                title TEXT NOT NULL,
                sponsor TEXT NOT NULL,
                member_state TEXT NOT NULL,
                trial_status TEXT NOT NULL,
                first_entry_date TEXT,
                trial_results TEXT,
                last_updated TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def insert_clinical_trial(self, trial: ClinicalTrial) -> bool:
        """Insert a clinical trial into the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO clinical_trials 
                (id, title, description, status, phase, sponsor, start_date, 
                 completion_date, enrollment, conditions, interventions, locations, 
                 source, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                trial.id, trial.title, trial.description, trial.status.value,
                trial.phase.value if trial.phase else None, trial.sponsor,
                trial.start_date.isoformat() if trial.start_date else None,
                trial.completion_date.isoformat() if trial.completion_date else None,
                trial.enrollment, json.dumps(trial.conditions),
                json.dumps(trial.interventions), json.dumps(trial.locations),
                trial.source, trial.last_updated.isoformat()
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error inserting clinical trial: {e}")
            return False
    
    def insert_eudract_record(self, record: EudraCTRecord) -> bool:
        """Insert an EudraCT record into the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO eudract_records 
                (eudract_number, sponsor_protocol_number, title, sponsor, 
                 member_state, trial_status, first_entry_date, trial_results, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                record.eudract_number, record.sponsor_protocol_number, record.title,
                record.sponsor, record.member_state, record.trial_status,
                record.date_on_which_this_record_was_first_entered_in_the_eudract_database.isoformat() if record.date_on_which_this_record_was_first_entered_in_the_eudract_database else None,
                json.dumps(record.trial_results) if record.trial_results else None,
                record.last_updated.isoformat()
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error inserting EudraCT record: {e}")
            return False
    
    def get_all_clinical_trials(self) -> List[Dict[str, Any]]:
        """Get all clinical trials from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM clinical_trials')
            rows = cursor.fetchall()
            
            conn.close()
            
            # Convert to list of dictionaries
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            print(f"Error fetching clinical trials: {e}")
            return []
    
    def get_all_eudract_records(self) -> List[Dict[str, Any]]:
        """Get all EudraCT records from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM eudract_records')
            rows = cursor.fetchall()
            
            conn.close()
            
            # Convert to list of dictionaries
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            print(f"Error fetching EudraCT records: {e}")
            return []

# Global database instance
db = Database()
