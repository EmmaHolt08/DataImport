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

def load_spatialite_extension(dbapi_connection, connection_record):
    """
    Function to load SpatiaLite extension for SQLite connections.
    This is called when a new connection is created by SQLAlchemy.
    """
    try:
        dbapi_connection.enable_load_extension(True)
        dbapi_connection.load_extension("/usr/lib/x86_64-linux-gnu/mod_spatialite.so") 
        dbapi_connection.enable_load_extension(False) # Disable for security after loading
    except sqlite3.OperationalError as e:
        print(f"Warning: Could not load SpatiaLite extension. This is expected if not using SQLite with spatial functions. Error: {e}")


# Create the SQLAlchemy engine. This is the main interface to your database.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        creator=lambda: sqlite3.connect(SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")),
        connect_args={"check_same_thread": False} # Often needed for SQLite in multi-threaded contexts like web servers
    )
    # Register the event listener to load SpatiaLite when a new connection is established
    sqlalchemy.event.listen(engine, "connect", load_spatialite_extension)
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