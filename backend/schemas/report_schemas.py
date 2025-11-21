from pydantic import BaseModel
from decimal import Decimal


class ReportSchema(BaseModel):
    work_days: int | None
    work_hours: int | None
    total_earnings: Decimal | None

