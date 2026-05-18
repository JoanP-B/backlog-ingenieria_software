import asyncio
from sqlalchemy import text
from app.infrastructure.database import engine

async def main():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'candidates'"))
        columns = res.fetchall()
        print("COLUMNS IN 'candidates' TABLE:")
        for col in columns:
            print(f"- Name: {col[0]}, Type: {col[1]}, Nullable: {col[2]}")

if __name__ == "__main__":
    asyncio.run(main())
