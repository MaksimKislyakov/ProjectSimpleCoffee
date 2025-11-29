from fastapi import APIRouter, Depends

from services.coffee_shop_service import CoffeeShopService

from api.v1.dependencies import get_coffee_shop_service, get_current_user

from models.user_model import User


router = APIRouter(prefix="/api/v1/coffee_shop", tags=["coffee_shop"])

@router.get("/get_coffee_shops")
async def get_coffee_shops(coffee_shop_service: CoffeeShopService = Depends(get_coffee_shop_service), 
                           user: User = Depends(get_current_user)):
    return await coffee_shop_service.get_coffee_shop_info(user)