import asyncio
from db.session import async_session
from models.user import User
from core.security import hash_password

async def create_user():
    async with async_session() as session:
        user = User(
            username="maksim",
            hashed_password=hash_password("12345")
        )
        session.add(user)
        await session.commit()
        print("✅ User 'maksim' created")

if __name__ == "__main__":
    asyncio.run(create_user())