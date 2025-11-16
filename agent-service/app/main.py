import asyncio
import sys
import os

# Add the parent directory to Python path so 'app' module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import agent 

async def main():
    answer = await agent.run_agent("Design a scalable microservices architecture for an e-commerce platform that can handle high traffic during sales events.")
    print("="*40)
    print("Agent Response:")
    print(answer)

if __name__ == "__main__":
    asyncio.run(main())