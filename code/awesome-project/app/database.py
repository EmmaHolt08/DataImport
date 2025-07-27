# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

import sqlite3
import sqlalchemy.event
# Load environment variables from the .env file at the project root
load_dotenv()

# Get the database URL from the environment variable
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Basic error handling if the URL isn't set
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set. Please check your .env file.")

def load_spatialite_extension_on_connect(dbapi_connection, connection_record):
    """
    Function to enable extension loading for SQLite and try to load SpatiaLite.
    """
    try:
        # Enable extension loading for this connection
        dbapi_connection.enable_load_extension(True)
        
        potential_spatialite_paths = [
            "/usr/lib/x86_64-linux-gnu/mod_spatialite.so", # Confirmed by your 'find'
            "/usr/lib/sqlite3/mod_spatialite.so",         # Original guess
            "/usr/local/lib/mod_spatialite.so",
            "/usr/local/bin/mod_spatialite.so",
            "mod_spatialite",                              # Try just the name if it's in a system path
        ]
        
        loaded = False
        for path in potential_spatialite_paths:
            try:
                dbapi_connection.load_extension("/usr/lib/x86_64-linux-gnu/mod_spatialite.so")                
                print(f"Successfully loaded SpatiaLite from: {path}")
                loaded = True
                break
            except sqlite3.OperationalError as e:
                print(f"Failed to load SpatiaLite from {path}: {e}")
        
        if not loaded:
            print("ERROR: SpatiaLite extension could not be loaded from any known path.")
            # Optionally raise an error here if you consider it fatal for app startup
            # raise RuntimeError("SpatiaLite extension missing or failed to load")

    except Exception as e:
        print(f"CRITICAL ERROR during SpatiaLite setup: {e}")
    finally:
        # Always disable extension loading after trying to load, for security
        dbapi_connection.enable_load_extension(False)


# Create the SQLAlchemy engine. This is the main interface to your database.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        creator=lambda: sqlite3.connect(SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")),
        connect_args={"check_same_thread": False} # Often needed for SQLite in multi-threaded contexts like web servers
    )
    # Register the event listener to load SpatiaLite when a new connection is established
    sqlalchemy.event.listen(engine, "connect", load_spatialite_extension_on_connect)
else:
    # For other database types (PostgreSQL, etc.), create engine normally
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
# Create a SessionLocal class. Each instance of SessionLocal will be a database session.
# autocommit=False ensures transactions are managed manually (you commit changes).
# autoflush=False prevents automatic flushing, giving you more control.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our SQLAlchemy models.
Base = declarative_base()

# Dependency function for FastAPI to get a database session for each request.
# The 'yield' keyword makes it a context manager, ensuring the session is closed.
def get_db():
    db = SessionLocal() # Create a new session
    try:
        yield db        # Yield the session to the FastAPI endpoint
    finally:
        db.close()      # Ensure the session is closed after the request is done