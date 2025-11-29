from fastapi import FastAPI
from api.v1.routes import auth, schedule, user, report_route, coffee_shop_route

app = FastAPI(title="Simple Coffee Scheduler")

app.include_router(auth.router)
app.include_router(schedule.router)
app.include_router(user.router)
app.include_router(report_route.router)
app.include_router(coffee_shop_route.router)