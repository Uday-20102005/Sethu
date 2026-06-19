from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from contextlib import asynccontextmanager

from routes import auth, farmer, buyer, bookings, chat, notifications, flash_sales, admin
from sockets.chat_socket import sio
from scheduler.main_scheduler import start_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()


fastapi_app = FastAPI(title="AgriMarket API", version="1.0.0", lifespan=lifespan)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register HTTP Routers
fastapi_app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
fastapi_app.include_router(farmer.router, prefix="/api/farmer", tags=["Farmer"])
fastapi_app.include_router(buyer.router, prefix="/api", tags=["Buyer"])
fastapi_app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
fastapi_app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
fastapi_app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
fastapi_app.include_router(flash_sales.router, prefix="/api/flash-sales", tags=["Flash Sales"])
fastapi_app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@fastapi_app.get("/")
async def root():
    return {"message": "AgriMarket API is running"}

# Mount Socket.IO
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)