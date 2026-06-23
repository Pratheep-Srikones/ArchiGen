import uuid

def generate_uuid() -> str:
    """
    Generate a random UUID (UUIDv4) and return it as a standard 36-character string.
    
    Returns:
        str: A randomly generated UUID in string format.
    """
    return str(uuid.uuid4())