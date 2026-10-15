from redis.asyncio import Redis

from app.config.config import config

redis_client: Redis | None = None


async def connect_redis():
    global redis_client

    redis_client = await Redis(
        host=config.redis_host, port=config.redis_port, decode_responses=True
    )
    await redis_client.ping()
    print("Redis connected successfully")


async def close_redis():
    if redis_client:
        await redis_client.close()
        print("Redis connection closed")


async def get_redis_client() -> Redis:
    if redis_client is None:
        await connect_redis()
    return redis_client
