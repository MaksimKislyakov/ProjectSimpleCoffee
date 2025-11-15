from fastapi import APIRouter, Depends
from schemas.schedule_schemas import ScheduleCreate, ScheduleRead, ScheduleDelete
from services.schedule_service import ScheduleService
from api.v1.dependencies import get_schedule_service, get_current_user
from models.user import User


router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])

@router.post("/", response_model=ScheduleCreate)
async def create_schedule(data: ScheduleCreate,
                          schedule_service: ScheduleService = Depends(get_schedule_service), 
                          user: User = Depends(get_current_user)):
    return await schedule_service.create_new_item_schedule(data, user)

@router.get("/", response_model=list[ScheduleRead])
async def list_schedule(schedule_service: ScheduleService = Depends(get_schedule_service), 
                        user: User = Depends(get_current_user)):
    return await schedule_service.get_all_schedules(user)

@router.delete("/{schedule_id}", response_model=ScheduleRead)
async def delete_schedule(schedule_id: int,
                          schedule_service: ScheduleService = Depends(get_schedule_service), 
                          user: User = Depends(get_current_user)):
    return await schedule_service.delete_item_schedule(schedule_id, user)