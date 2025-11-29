from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class CreateReport(BaseModel):
    user_id: int
    total_fine: float | None
    total_award: float | None

class ReportSchema(CreateReport):
    work_hours: int | None
    work_days: int | None
    total_earnings: Decimal | None
