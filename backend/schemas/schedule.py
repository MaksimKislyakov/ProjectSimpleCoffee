from pydantic import BaseModel
from datetime import datetime

class ScheduleBase(BaseModel):
    coffee_shop: str
    employee: str
    shift_start: datetime
    shift_end: datetime

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleRead(ScheduleBase):
    id: int

    class Config:
        from_attributes = True
