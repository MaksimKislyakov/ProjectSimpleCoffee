from fastapi import APIRouter, Depends
from schemas.schedule_schemas import ScheduleCreate, ScheduleRead, ScheduleDelete
from services.schedule_service import ScheduleService
from api.v1.dependencies import get_schedule_service, get_current_user
from models.user_model import User
from typing import Optional
from datetime import datetime


router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])

@router.post("/create_schedule", response_model=ScheduleCreate)
async def create_schedule(data: ScheduleCreate,
                          schedule_service: ScheduleService = Depends(get_schedule_service), 
                          user: User = Depends(get_current_user)):
    return await schedule_service.create_new_item_schedule(data, user)

@router.get("/get_all_schedule", response_model=list[ScheduleRead])
async def list_schedule(schedule_service: ScheduleService = Depends(get_schedule_service), 
                        user: User = Depends(get_current_user)):
    return await schedule_service.get_all_schedules(user)

@router.delete("/delete_schedule/{schedule_id}", response_model=ScheduleRead)
async def delete_schedule(schedule_id: int,
                          schedule_service: ScheduleService = Depends(get_schedule_service), 
                          user: User = Depends(get_current_user)):
    return await schedule_service.delete_item_schedule(schedule_id, user)

@router.get("/get_all_schedule_is_confirmed_false", response_model=list[ScheduleRead])
async def get_all_schedule_is_confirmed_false(schedule_service: ScheduleService = Depends(get_schedule_service),
                                              user: User = Depends(get_current_user)):
    return await schedule_service.get_all_schedules_is_confirmed_false(user)

@router.patch("/{schedule_id}/actual-time", response_model=ScheduleRead)
async def update_schedule_actual_time(
    schedule_id: int,
    actual_start_time: Optional[datetime] = None,
    actual_end_time: Optional[datetime] = None,
    schedule_service: ScheduleService = Depends(get_schedule_service),
    current_user: User = Depends(get_current_user)
):
    return await schedule_service.update_schedule_actual_time(
        schedule_id=schedule_id,
        current_user=current_user,
        actual_start_time=actual_start_time,
        actual_end_time=actual_end_time
    )

@router.patch("/{schedule_id}/confirm")
async def update_schedule_confirmation(
    schedule_id: int,
    is_confirmed: bool,
    schedule_start_time: Optional[datetime] = None,
    schedule_end_time: Optional[datetime] = None,
    schedule_service: ScheduleService = Depends(get_schedule_service),
    current_user: User = Depends(get_current_user)
):
    return await schedule_service.update_schedule_is_confirmed(
        schedule_id=schedule_id,
        is_confirmed=is_confirmed,
        schedule_start_time=schedule_start_time,
        schedule_end_time=schedule_end_time,
        current_user=current_user
    )