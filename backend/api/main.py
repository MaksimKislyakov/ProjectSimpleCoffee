from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app, Counter, Histogram, generate_latest
import time
from api.v1.routes import report_route, coffee_shop_route
from api.v1.routes import auth_route, schedule_route, user_route

# Метрики Prometheus
REQUEST_COUNT = Counter(
    'request_count', 'App Request Count',
    ['app_name', 'method', 'endpoint', 'http_status']
)

REQUEST_LATENCY = Histogram(
    'request_latency_seconds', 'Request latency',
    ['app_name', 'endpoint']
)

app = FastAPI(title="Simple Coffee Scheduler")

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Middleware для сбора метрик
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    
    process_time = time.time() - start_time
    REQUEST_LATENCY.labels(
        app_name="simple-coffee",
        endpoint=request.url.path
    ).observe(process_time)
    
    REQUEST_COUNT.labels(
        app_name="simple-coffee",
        method=request.method,
        endpoint=request.url.path,
        http_status=response.status_code
    ).inc()
    
    return response

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(auth_route.router)
app.include_router(schedule_route.router)
app.include_router(user_route.router)
app.include_router(report_route.router)
app.include_router(coffee_shop_route.router)