from fastapi import APIRouter, Depends
from schemas.schedule import ScheduleCreate, ScheduleRead
from repositories.schedule_repository import ScheduleRepository
from api.v1.dependencies import get_schedule_repository
from models.schedule import Schedule
from fastapi import Body

router = APIRouter(prefix="/schedule", tags=["schedule"])

@router.get("/", response_model=list[ScheduleRead])
async def list_schedule(repo: ScheduleRepository = Depends(get_schedule_repository)):
    return await repo.get_all()

@router.post("/", response_model=ScheduleRead)
async def create_schedule(
    data: ScheduleCreate, 
    repo: ScheduleRepository = Depends(get_schedule_repository)
):
    schedule = Schedule(**data.model_dump())
    return await repo.create(schedule)
