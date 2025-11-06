from fastapi import APIRouter, Depends
from schemas.schedule_schemas import ScheduleCreate, ScheduleRead
from repositories.schedule_repository import ScheduleRepository
from services.schedule_service import ScheduleService
from api.v1.dependencies import get_schedule_repository, get_schedule_service, get_current_user
from models.schedule import Schedule
from models.user import User
from fastapi import Body

router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])

@router.get("/", response_model=list[ScheduleRead])
async def list_schedule(schedule_service: ScheduleService = Depends(get_schedule_service), 
                        user: User = Depends(get_current_user)):
    return await schedule_service.get_all_schedules(user)

@router.post("/", response_model=ScheduleRead)
async def create_schedule(data: ScheduleCreate,
                          schedule_service: ScheduleService = Depends(get_schedule_service), 
                          user: User = Depends(get_current_user)):
    return await schedule_service.create_new_item_schedule(data, user)

