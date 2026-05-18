import asyncio
from jose import jwt, JWTError
from app.core.config import settings
from app.infrastructure.database import SessionLocal
from app.domain.models import User
from sqlalchemy.future import select

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdmFzcXVlenMxIiwiZXhwIjoxNzc5MDc3ODI5fQ.HlkYMkNxFC9bt2SpJ1U_zUl7zMgTGVNWxvRJyHYGREk"

async def test():
    print(f"JWT SECRET used: {settings.JWT_SECRET}")
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        username = payload.get("sub")
        print(f"Successfully decoded. Username: {username}")
        
        async with SessionLocal() as db:
            result = await db.execute(select(User).filter(User.username == username))
            user = result.scalars().first()
            if user is None:
                print("User NOT found in database!")
            else:
                print(f"User found: ID={user.id}, Username={user.username}")
    except JWTError as e:
        print(f"JWT Decode failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
