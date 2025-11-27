from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime

from services.report_service import ReportService

from api.v1.dependencies import get_report_service, get_current_user

from models.user_model import User
from models.report_model import ReportModel

from schemas.report_schemas import ReportSchema, CreateReport


router = APIRouter(prefix="/api/v1/report", tags=["report"])

@router.get("/get_my_report", response_model=ReportSchema)
async def get_report_for_one_user(
                                    start_date: datetime,
                                    end_date: datetime,
                                    report_service: ReportService = Depends(get_report_service), 
                                    user: User = Depends(get_current_user)
                                ):
    return await report_service.get_my_report_of_all_time(user, start_date, end_date)

@router.post("/create_report_total_award_or_fine", response_model=CreateReport)
async def create_report_total_award_or_fine(report_data: CreateReport,
                                            report_service: ReportService = Depends(get_report_service),
                                            user: User = Depends(get_current_user)):
    return await report_service.create_total_award_or_fine(report_data, user)
