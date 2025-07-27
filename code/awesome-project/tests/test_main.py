from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sqlalchemy
from sqlalchemy.pool import StaticPool
import pytest
import sqlite3
from geoalchemy2 import load_spatialite

from main import app, get_db, Base
from app.models import UserInfo, DataImport 
from app.database import engine 


SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db" 

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

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(name="db_session", scope="function") # Scope 'function' for per-test isolation
def db_session_fixture(): # Renamed the function to avoid confusion
    # This setup code is what was in override_get_db
    # It prepares the test database
    with test_engine.connect() as conn:
        try:
            load_spatialite(conn) 
            print("geoalchemy2.load_spatialite() applied successfully within db_session setup.")
            result = conn.execute(text("SELECT spatialite_version()")).scalar()
            print(f"SpatiaLite version from test_engine in fixture: {result}")
        except Exception as e:
            print(f"ERROR: geoalchemy2.load_spatialite() failed within db_session setup: {e}")
            raise 
        
    Base.metadata.create_all(bind=test_engine) # Create tables for tests
    
    db = TestingSessionLocal()
    try:
        yield db # This is the database session that tests and FastAPI will use
    finally:
        db.close()

def get_db_override():
     yield from TestingSessionLocal()

@pytest.fixture(name="db_session_for_tests", scope="function") # Renamed for clarity
def db_session_for_tests_fixture():
    # Database setup logic moved from override_get_db
    with test_engine.connect() as conn:
        try:
            load_spatialite(conn.connection)
            print("geoalchemy2.load_spatialite() applied successfully within db_session_for_tests setup.")
            conn.execute(text("SELECT spatialite_version()")).scalar()
            print("SpatiaLite version check passed in db_session_for_tests fixture setup.")
        except Exception as e:
            print(f"ERROR: geoalchemy2.load_spatialite() failed within db_session_for_tests setup: {e}")
            raise 
        
    Base.metadata.create_all(bind=test_engine) 
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(name="get_db_override_for_fastapi") # Renamed again for clarity
def get_db_override_for_fastapi_fixture(db_session_for_tests):
    yield db_session_for_tests

#app.dependency_overrides[get_db] = get_test_db_override
app.dependency_overrides[get_db] = get_db_override_for_fastapi_fixture


# Create a TestClient instance
client = TestClient(app)

# --- Actual Tests ---
def test_home_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "we are home"}

def test_db_session_can_add_user(db_session_for_tests):
    from app.models import UserInfo
    from main import Hasher # Ensure Hasher is imported here if you don't use it elsewhere at top level

    db_session = db_session_for_tests 

    test_user_id = "test_user_id_123"
    test_username = "directuser"
    test_email = "direct@example.com"
    test_password_hash = Hasher.get_password_hash("directpassword")

    new_user = UserInfo(
        user_id=test_user_id,
        username=test_username,
        user_email=test_email,
        user_password=test_password_hash
    )
    db_session.add(new_user)
    db_session.commit()

    retrieved_user = db_session.query(UserInfo).filter(UserInfo.user_id == test_user_id).first()
    assert retrieved_user is not None
    assert retrieved_user.username == test_username
    assert retrieved_user.user_email == test_email
    print("db_session successfully added and retrieved a user directly.")


def test_register_user_success(db_session_for_tests): # Keep this test
    print("\n--- Starting test_register_user_success ---")
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword"
    }
    print(f"Attempting to register user with data: {user_data}")
    response = client.post("/register", json=user_data)
    print(f"Response status code: {response.status_code}")
    print(f"Response JSON: {response.json()}")
    assert response.status_code == 200
    response_json = response.json()
    assert "user_id" in response_json
    assert response_json["username"] == "testuser"
    assert response_json["user_email"] == "test@example.com"

    # Verify user is in the database
    db_session = db_session_for_tests # Assign for clarity
    user_in_db = db_session.query(UserInfo).filter(UserInfo.user_email == "test@example.com").first() 
    print(f"User in DB after registration: {user_in_db}")
    assert user_in_db is not None
    assert user_in_db.username == "testuser"
    print("--- test_register_user_success finished ---")


# def test_register_user_success(db_session):
    # """Test successful user registration."""
    # user_data = {
    #     "username": "testuser",
    #     "email": "test@example.com",
    #     "password": "testpassword"
    # }
    # response = client.post("/register", json=user_data)
    # assert response.status_code == 200
    # response_json = response.json()
    # assert "user_id" in response_json
    # assert response_json["username"] == "testuser"
    # assert response_json["user_email"] == "test@example.com"

    # # Verify user is in the database
    # user_in_db = db_session.query(UserInfo).filter(UserInfo.user_email == "test@example.com").first()
    # assert user_in_db is not None
    # assert user_in_db.username == "testuser"

# def test_register_user_duplicate_email(db_session):
#     """Test registration with a duplicate email."""
#     # First registration (ensure it exists)
#     user_data_1 = {
#         "username": "userone",
#         "email": "duplicate@example.com",
#         "password": "password1"
#     }
#     client.post("/register", json=user_data_1)

#     # Second registration with same email
#     user_data_2 = {
#         "username": "usertwo",
#         "email": "duplicate@example.com",
#         "password": "password2"
#     }
#     response = client.post("/register", json=user_data_2)
#     assert response.status_code == 400
#     assert response.json()["detail"] == "Email already registered"

# def test_register_user_duplicate_username(db_session):
#     """Test registration with a duplicate username (case-insensitive)."""
#     # First registration
#     user_data_1 = {
#         "username": "duplicateuser",
#         "email": "email1@example.com",
#         "password": "password1"
#     }
#     client.post("/register", json=user_data_1)

#     # Second registration with same username (different case)
#     user_data_2 = {
#         "username": "DuplicateUser", # Different case
#         "email": "email2@example.com",
#         "password": "password2"
#     }
#     response = client.post("/register", json=user_data_2)
#     assert response.status_code == 400
#     assert response.json()["detail"] == "Username taken. Choose a new one"

# def test_login_success(db_session):
#     """Test successful user login."""
#     # Register a user first
#     user_data = {
#         "username": "loginuser",
#         "email": "login@example.com",
#         "password": "loginpassword"
#     }
#     client.post("/register", json=user_data)

#     # Now attempt to login
#     login_data = {
#         "email": "login@example.com",
#         "password": "loginpassword"
#     }
#     response = client.post("/token", data=login_data)
#     assert response.status_code == 200
#     response_json = response.json()
#     assert "access_token" in response_json
#     assert response_json["token_type"] == "bearer"
#     assert response_json["username"] == "loginuser"
#     assert response_json["email"] == "login@example.com"

# def test_login_invalid_credentials(db_session):
#     """Test login with incorrect password."""
#     # Register a user first
#     user_data = {
#         "username": "badpassuser",
#         "email": "badpass@example.com",
#         "password": "correctpassword"
#     }
#     client.post("/register", json=user_data)

#     # Attempt to login with wrong password
#     login_data = {
#         "email": "badpass@example.com",
#         "password": "wrongpassword"
#     }
#     response = client.post("/token", data=login_data)
#     assert response.status_code == 401
#     assert response.json()["detail"] == "Incorrect email or password"

# def test_login_non_existent_email(db_session):
#     """Test login with non-existent email."""
#     login_data = {
#         "email": "nonexistent@example.com",
#         "password": "anypassword"
#     }
#     response = client.post("/token", data=login_data)
#     assert response.status_code == 401
#     assert response.json()["detail"] == "Incorrect email or password"