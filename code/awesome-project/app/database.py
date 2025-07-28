# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

import sqlite3
import sqlalchemy.event


load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set. Please check your .env file.")

# def load_spatialite_extension_on_connect(dbapi_connection, connection_record):
#     """
#     Function to enable extension loading for SQLite and try to load SpatiaLite.
#     """
#     try:
#         dbapi_connection.enable_load_extension(True)
        
#         potential_spatialite_paths = [
#             "/usr/lib/x86_64-linux-gnu/mod_spatialite.so", 
#             "/usr/lib/sqlite3/mod_spatialite.so",         
#             "/usr/local/lib/mod_spatialite.so",
#             "/usr/local/bin/mod_spatialite.so",
#             "mod_spatialite",                             
#         ]
        
#         loaded = False
#         for path in potential_spatialite_paths:
#             try:
#                 dbapi_connection.load_extension("/usr/lib/x86_64-linux-gnu/mod_spatialite.so")                
#                 print(f"Successfully loaded SpatiaLite from: {path}")
#                 loaded = True
#                 break
#             except sqlite3.OperationalError as e:
#                 print(f"Failed to load SpatiaLite from {path}: {e}")
        
#         if not loaded:
#             print("ERROR: SpatiaLite extension could not be loaded from any known path.")


#     except Exception as e:
#         print(f"CRITICAL ERROR during SpatiaLite setup: {e}")
#     finally:
#         # Always disable extension loading after trying to load, for security
#         dbapi_connection.enable_load_extension(False)


# if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///"):
#     engine = create_engine(
#         SQLALCHEMY_DATABASE_URL,
#         creator=lambda: sqlite3.connect(SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")),
#         connect_args={"check_same_thread": False} # Often needed for SQLite in multi-threaded contexts like web servers
#     )
#     # Register the event listener to load SpatiaLite when a new connection is established
#     sqlalchemy.event.listen(engine, "connect", load_spatialite_extension_on_connect)
# else:
#     
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal() 
    try:
        yield db        
    finally:
        db.close()     