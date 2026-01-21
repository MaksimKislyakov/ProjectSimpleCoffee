from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from pydantic import ConfigDict

class ScheduleBase(BaseModel):
    coffee_shop_id: int
    status: str
    schedule_start_time: datetime
    schedule_end_time: datetime
    is_confirmed: bool | None


class ScheduleCreate(ScheduleBase):
    user_id: int


class ScheduleRead(ScheduleBase):
    id: int
    user_id: int
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ScheduleUpdate(ScheduleBase):
    id: int
    user_id: int
    actual_start_time: datetime
    actual_end_time: datetime


class ScheduleDelete(BaseModel):
    id: int
