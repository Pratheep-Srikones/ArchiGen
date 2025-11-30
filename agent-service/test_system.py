#!/usr/bin/env python3
"""
Simple test script to validate the agent service configuration and dependencies.
"""
import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_imports():
    """Test if all required modules can be imported."""
    print("Testing imports...")
    
    try:
        from google.adk.runners import InMemoryRunner
        print("✓ InMemoryRunner imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import InMemoryRunner: {e}")
        return False
    
    try:
        from google.adk.agents import Agent
        print("✓ Agent imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Agent: {e}")
        return False
    
    try:
        from google.adk.models.google_llm import Gemini
        print("✓ Gemini imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Gemini: {e}")
        return False
    
    try:
        from google.adk.tools import google_search, AgentTool
        print("✓ Tools imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Tools: {e}")
        return False
    
    try:
        from app.config.config import config
        print("✓ Config imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import config: {e}")
        return False
    
    try:
        from app.data import prompts
        print("✓ Prompts imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import prompts: {e}")
        return False
    
    return True

def test_config():
    """Test if configuration is valid."""
    print("\\nTesting configuration...")
    
    try:
        from app.config.config import config
        
        # Check if API key is set
        if not config.gemini_api_key or config.gemini_api_key == "your_gemini_api_key_here":
            print("✗ GEMINI_API_KEY is not properly configured")
            print("  Please set a valid API key in the .env file")
            return False
        else:
            # Mask the API key for security
            masked_key = config.gemini_api_key[:10] + "..." + config.gemini_api_key[-4:]
            print(f"✓ GEMINI_API_KEY is configured: {masked_key}")
        
        print(f"✓ Port configured: {config.port}")
        print(f"✓ Retry options configured: {config.agent_retry_options}")
        
        return True
        
    except Exception as e:
        print(f"✗ Configuration error: {e}")
        return False

def test_basic_agent_creation():
    """Test if a basic agent can be created."""
    print("\\nTesting basic agent creation...")
    
    try:
        from google.adk.agents import Agent
        from google.adk.models.google_llm import Gemini
        from app.config.config import config
        
        # Create a simple Gemini instance
        gemini = Gemini(
            api_key=config.gemini_api_key,
            retry_options=config.agent_retry_options,
            model="gemini-2.5-flash-lite"
        )
        print("✓ Gemini model instance created")
        
        # Create a simple agent
        test_agent = Agent(
            name="Test_Agent",
            description="A simple test agent",
            instruction="You are a helpful assistant.",
            model=gemini,
        )
        print("✓ Test agent created successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to create basic agent: {e}")
        return False

def main():
    """Run all tests."""
    print("Agent Service Diagnostic Test")
    print("=" * 40)
    
    all_passed = True
    
    # Test imports
    all_passed &= test_imports()
    
    # Test configuration
    all_passed &= test_config()
    
    # Test basic agent creation
    all_passed &= test_basic_agent_creation()
    
    print("\\n" + "=" * 40)
    if all_passed:
        print("✓ All tests passed! The system should be ready to run.")
    else:
        print("✗ Some tests failed. Please fix the issues above before running the main application.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())