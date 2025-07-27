from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sqlalchemy
from sqlalchemy.pool import StaticPool
import pytest
import sqlite3
from geoalchemy2 import load_spatialite

# Import your FastAPI app and database components
# Adjust the import path based on your actual project structure
# For example, if your app.py (the code you provided) is directly in 'app' folder:
from main import app, get_db, Base
from app.models import UserInfo, DataImport # Import your models
from app.database import engine # This might need to be mocked or an in-memory db

# --- Database Setup for Testing ---
# We'll use an in-memory SQLite database for tests for speed and isolation.
# This avoids polluting your development database.
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db" # Or "sqlite:///:memory:" for purely in-memory

# --- NEW: Custom SQLite creator that explicitly loads SpatiaLite ---
def spatialite_sqlite_creator(db_url):
    """Custom creator function for SQLite to load SpatiaLite extension."""
    conn_path = db_url.replace("sqlite:///", "")
    conn = sqlite3.connect(conn_path)
    conn.enable_load_extension(True)
    try:
        # Use the path confirmed by 'find' command
        # This is the path where apt-get install libsqlite3-mod-spatialite places it on ubuntu-latest
        conn.load_extension("/usr/lib/x86_64-linux-gnu/mod_spatialite.so")
        print("SpatiaLite loaded successfully in test_engine creator.")
    except sqlite3.OperationalError as e:
        print(f"ERROR: Failed to load SpatiaLite in test_engine creator: {e}")
        # If it critically fails here, we might need to stop.
        # For CI, we want to know if it's not working.
        raise # Re-raise if we cannot load SpatiaLite
    finally:
        conn.enable_load_extension(False) # Always disable after loading
    return conn

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Use the custom creator that loads SpatiaLite
    creator=lambda: spatialite_sqlite_creator(SQLALCHEMY_DATABASE_URL),
    connect_args={"check_same_thread": False},
    poolclass=StaticPool, # Crucial for in-memory SQLite with FastAPI Depends
)

try:
    load_spatialite(test_engine)
    print("SpatiaLite configured for test_engine via geoalchemy2.load_spatialite()")
except Exception as e:
    print(f"ERROR: geoalchemy2.load_spatialite() failed for test_engine: {e}")
    raise

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override the get_db dependency to use the test database session
@pytest.fixture(name="db_session")
def override_get_db():
    # TEST: Check if SpatiaLite is loaded BEFORE creating tables
    # This might help debug if it fails after engine creation but before table creation
    try:
        with test_engine.connect() as conn:
            result = conn.execute(sqlalchemy.text("SELECT spatialite_version()")).scalar()
            print(f"SpatiaLite version from test_engine: {result}")
    except Exception as e:
        print(f"WARNING: Could not check SpatiaLite version from test_engine: {e}")
        # If this is the problem, the table creation will fail
        # This print will help us see if the engine itself got spatialite

    Base.metadata.create_all(bind=test_engine) # Create tables for tests
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Optional: drop all tables after each test function for complete isolation
        # Base.metadata.drop_all(bind=test_engine)

app.dependency_overrides[get_db] = override_get_db

# Create a TestClient instance
client = TestClient(app)

# --- Actual Tests ---

def test_home_endpoint(db_session):
    """Test the root '/' endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "we are home"}

def test_register_user_success(db_session):
    """Test successful user registration."""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword"
    }
    response = client.post("/register", json=user_data)
    assert response.status_code == 200
    response_json = response.json()
    assert "user_id" in response_json
    assert response_json["username"] == "testuser"
    assert response_json["user_email"] == "test@example.com"

    # Verify user is in the database
    user_in_db = db_session.query(UserInfo).filter(UserInfo.user_email == "test@example.com").first()
    assert user_in_db is not None
    assert user_in_db.username == "testuser"

def test_register_user_duplicate_email(db_session):
    """Test registration with a duplicate email."""
    # First registration (ensure it exists)
    user_data_1 = {
        "username": "userone",
        "email": "duplicate@example.com",
        "password": "password1"
    }
    client.post("/register", json=user_data_1)

    # Second registration with same email
    user_data_2 = {
        "username": "usertwo",
        "email": "duplicate@example.com",
        "password": "password2"
    }
    response = client.post("/register", json=user_data_2)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_register_user_duplicate_username(db_session):
    """Test registration with a duplicate username (case-insensitive)."""
    # First registration
    user_data_1 = {
        "username": "duplicateuser",
        "email": "email1@example.com",
        "password": "password1"
    }
    client.post("/register", json=user_data_1)

    # Second registration with same username (different case)
    user_data_2 = {
        "username": "DuplicateUser", # Different case
        "email": "email2@example.com",
        "password": "password2"
    }
    response = client.post("/register", json=user_data_2)
    assert response.status_code == 400
    assert response.json()["detail"] == "Username taken. Choose a new one"

def test_login_success(db_session):
    """Test successful user login."""
    # Register a user first
    user_data = {
        "username": "loginuser",
        "email": "login@example.com",
        "password": "loginpassword"
    }
    client.post("/register", json=user_data)

    # Now attempt to login
    login_data = {
        "email": "login@example.com",
        "password": "loginpassword"
    }
    response = client.post("/token", data=login_data)
    assert response.status_code == 200
    response_json = response.json()
    assert "access_token" in response_json
    assert response_json["token_type"] == "bearer"
    assert response_json["username"] == "loginuser"
    assert response_json["email"] == "login@example.com"

def test_login_invalid_credentials(db_session):
    """Test login with incorrect password."""
    # Register a user first
    user_data = {
        "username": "badpassuser",
        "email": "badpass@example.com",
        "password": "correctpassword"
    }
    client.post("/register", json=user_data)

    # Attempt to login with wrong password
    login_data = {
        "email": "badpass@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/token", data=login_data)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_login_non_existent_email(db_session):
    """Test login with non-existent email."""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "anypassword"
    }
    response = client.post("/token", data=login_data)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"