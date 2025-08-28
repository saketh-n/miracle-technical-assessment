from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class TrialStatus(str, Enum):
    RECRUITING = "recruiting"
    NOT_YET_RECRUITING = "not_yet_recruiting"
    ENROLLING_BY_INVITATION = "enrolling_by_invitation"
    ACTIVE_NOT_RECRUITING = "active_not_recruiting"
    COMPLETED = "completed"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"
    WITHDRAWN = "withdrawn"

class Phase(str, Enum):
    PHASE_1 = "phase_1"
    PHASE_2 = "phase_2"
    PHASE_3 = "phase_3"
    PHASE_4 = "phase_4"
    NOT_APPLICABLE = "not_applicable"

class ClinicalTrial(BaseModel):
    """Clinical trial data model"""
    id: str = Field(..., description="Unique trial identifier")
    title: str = Field(..., description="Trial title")
    description: Optional[str] = Field(None, description="Trial description")
    status: TrialStatus = Field(..., description="Current trial status")
    phase: Optional[Phase] = Field(None, description="Trial phase")
    sponsor: str = Field(..., description="Trial sponsor")
    start_date: Optional[datetime] = Field(None, description="Trial start date")
    completion_date: Optional[datetime] = Field(None, description="Expected completion date")
    enrollment: Optional[int] = Field(None, description="Target enrollment")
    conditions: List[str] = Field(default_factory=list, description="Medical conditions")
    interventions: List[str] = Field(default_factory=list, description="Interventions")
    locations: List[str] = Field(default_factory=list, description="Trial locations")
    source: str = Field(..., description="Data source (e.g., ClinicalTrials.gov)")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class EudraCTRecord(BaseModel):
    """EudraCT data model"""
    eudract_number: str = Field(..., description="EudraCT number")
    sponsor_protocol_number: Optional[str] = Field(None, description="Sponsor protocol number")
    title: str = Field(..., description="Trial title")
    sponsor: str = Field(..., description="Trial sponsor")
    member_state: str = Field(..., description="Member state")
    trial_status: str = Field(..., description="Trial status")
    date_on_which_this_record_was_first_entered_in_the_eudract_database: Optional[datetime] = Field(None, description="First entry date")
    trial_results: Optional[Dict[str, Any]] = Field(None, description="Trial results data")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class APIResponse(BaseModel):
    """Standard API response model"""
    success: bool = Field(..., description="Request success status")
    message: str = Field(..., description="Response message")
    data: Optional[Any] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")

class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = Field(default=False, description="Request success status")
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Error details")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")
