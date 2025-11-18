from fastapi import FastAPI
from api.v1.routes import auth, schedule, user

app = FastAPI(title="Simple Coffee Scheduler")

app.include_router(auth.router)
app.include_router(schedule.router)
app.include_router(user.router)