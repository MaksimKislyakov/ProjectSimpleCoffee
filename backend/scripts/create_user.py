import asyncio
from db.session import async_session
from models.user import User
from core.security import hash_password
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def create_user():
    async with async_session() as session:
        user = User(
            user_id=3,
            hashed_password=hash_password("12345")
        )
        session.add(user)
        await session.commit()
        print("✅ User 'maksim' created")

if __name__ == "__main__":
    asyncio.run(create_user())