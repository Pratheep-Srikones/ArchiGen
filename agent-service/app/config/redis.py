# pyrefly: ignore [missing-import]
from redis.asyncio import Redis
from typing import Optional

from app.config.config import config


redis_client: Optional[Redis] = None

async def connect_redis():
    global redis_client

    redis_client = await Redis(host=config.redis_host, port=config.redis_port, decode_responses=True)
    await redis_client.ping()
    print("Redis connected successfully")


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        print("Redis connection closed")

async def get_redis_client() -> Redis:
    global redis_client
    if redis_client is None:
        await connect_redis()
    return redis_client
