# Changes Attempted and Issues Faced

This branch attempted to utilize the full datasets instead of the (500 subset) but is broken due to unresolved errors. 

## Changes Attempted
- Migrated from JSON caches (`clinicaltrials_cache.json`, `eudract_data.json`) to SQLite databases (`clinical_trials.db`, `eudract.db`) for scalability with large datasets (~551k ClinicalTrials.gov, ~44k EudraCT trials).
- Scaled to full datasets by removing `NUM_TRIALS=500` limit, fetching ClinicalTrials.gov until `nextPageToken` is None and EudraCT until empty pages.
- Implemented resumability using a `metadata` table to store `last_token`, `last_page`, and `fetch_complete` for resuming after crashes.
- Replaced `filter_data` with SQL queries in endpoints (e.g., `/aggregations/by_year`, `/by_condition`) using `json_each` for JSON fields like `conditions` and `locations`.
- Added client-side caching with `@tanstack/react-query` in the frontend to cache API responses for 5 minutes, reducing backend load.
- Would need to consider pagination if frontend to backend api calls took too long due to size
- Would need to optimize `/refresh` endpoint to only fetch new trials, perhaps by timestamp, otherwise refreshing 551k+ trials takes too long

## Issues Faced
- **NameError: `sqlite3` not defined**: Endpoints like `/aggregations/by_duration` failed because `main.py` didn’t import `sqlite3` for exception handling. Fixed by adding `import sqlite3`.
- **Malformed JSON in SQLite**: `/conditions`, `/by_phase`, `/by_condition` failed with `SQLite error: malformed JSON` due to invalid `conditions` and `phases` values (e.g., `json.dumps(None)`) in `clinical_trials.db`. Fixed by validating inputs as lists in `insert_clinicaltrials_studies`.
- **No Such Column in /by_duration**: Failed with `no such column: start_date` due to incorrect SQL query structure (filters outside subquery). Fixed by moving filters into the subquery.
- **NoneType Error in /by_year**: Failed with `'<' not supported between NoneType and str` because `strftime('%Y', start_date)` returned `None` for null dates. Fixed by filtering out `None` years before sorting.
- **Invalid EudraCT Enrollment**: `fetch_eudract_data` failed with `invalid literal for int()` on non-numeric `F.4.2.2` values (e.g., `'110 G. Investigator Networks...'`). Fixed by validating enrollment in `insert_eudract_trials`.
- **Connection Pool Full for EudraCT**: `fetch_eudract_data` logged `Connection pool is full` warnings due to `max_workers=20` exceeding pool size (10). Fixed by reducing to `max_workers=10` and increasing sleep to 5s.
- **Scheduler Error**: `startup_event` failed with `TypeError: NoneType can't be used in 'await'` due to incorrect `await` on `scheduler.start()`. Fixed by making `startup_event` synchronous and initializing `scheduler` globally.