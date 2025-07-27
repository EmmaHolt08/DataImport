from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
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

@pytest.fixture(name="test_db_session", scope="function") # Renamed for ultimate clarity
def test_db_session_fixture_setup(): # This is the function that defines the fixture 'test_db_session'
    # 1. Database creation (runs once per test function/session if scoped)
    with test_engine.connect() as conn:
        try:
            load_spatialite(conn.connection) 
            print("geoalchemy2.load_spatialite() applied successfully within test_db_session setup.")
            result = conn.execute(text("SELECT spatialite_version()")).scalar()
            print(f"SpatiaLite version from test_engine in fixture: {result}")
        except Exception as e:
            print(f"ERROR: geoalchemy2.load_spatialite() failed within test_db_session setup: {e}")
            raise 
        
    Base.metadata.create_all(bind=test_engine) # Creates tables for tests
    
    # 2. Session creation (yields to the test, then closes)
    db = TestingSessionLocal()
    try:
        yield db # This is the actual Session object provided to tests
    finally:
        db.close()

# --- CRITICAL FIX: The FastAPI Dependency Override Function ---
# This is NOT a pytest fixture. It's a standard Python generator function
# that FastAPI expects. It will get its Session from the 'test_db_session' fixture.
def get_db_override():
    # We need to get the 'test_db_session' fixture from pytest.
    # The standard way is if this function is called *by pytest* as part of a fixture.
    # However, for `app.dependency_overrides`, FastAPI calls it directly.
    # The trick here is to ensure pytest manages the lifespan of `test_db_session`.

    # A common pattern for this is to use a "global" fixture or a "nested" fixture
    # in conftest.py. Since we are in a single file, this is tricky.

    # Option A (simplest, potentially less robust if complex fixture setup):
    # Just yield a new session directly, relying on test_db_session_fixture_setup
    # having created tables. This means the session is NOT managed by pytest.
    # This might bypass some of pytest's fixture management.

    # Option B (recommended for FastAPI TestClient, if test_db_session is used):
    # Make get_db_override a fixture as well, but it calls db_session directly.
    # No, that's what we did.

    # Let's try the pattern: fixture that provides session to test function,
    # and separately, a function that uses that same fixture for override.

    # THIS IS THE STANDARD WAY TO OVERRIDE FASTAPI DEPENDENCIES WITH PYTEST:
    # (Using the fixture as the actual override callable)
    # The fixture must directly return the generator expected by FastAPI's Depends.

    # The `test_db_session_fixture_setup` is already a generator that yields a Session.
    # So, we should assign this *generator function itself* as the override.

    # Let's try simply renaming the fixture and making it directly override.
    # This might have been the original intention.

    # This is where the confusion is. Let's simplify.
    pass # Remove this block, we'll try something else below


# --- OVERRIDE THE DEPENDENCY ---
# app.dependency_overrides[get_db] = get_db_override_for_fastapi_fixture # OLD LINE

# The most common pattern: The fixture function that sets up the DB
# is directly used as the override.
# The previous attempt failed because the fixture name for tests and the function
# name for the override were slightly off or nested.

# The `test_db_session_fixture_setup` is a generator function.
# FastAPI's `Depends(get_db)` also expects a generator function.
# So, let's assign the *fixture's underlying function* directly to the override.

# This means the fixture's function `test_db_session_fixture_setup` needs to be used directly.
# BUT, that function sets up the DB and yields. Pytest manages the setup/teardown.
# So, when FastAPI calls `test_db_session_fixture_setup`, pytest also calls it.

# Let's stick to the pattern where the override IS a fixture, and it requests the setup fixture.
# The problem `loc': ['query', 'db_session_for_tests']` is the key.
# It seems `TestClient` is somehow exposing the *name* of the fixture in the query params.
# This happens if FastAPI thinks the argument is for the API, not a dependency.

# This might be related to the `db: Session = Depends(get_db)` not correctly mapping.

# Let's verify `db: Session = Depends(get_db)` is correct in `main.py`
# Yes, it is: `def register_user(user: UserCreate, db: Session = Depends(get_db)):`

# The `loc: ['query', 'db_session_for_tests']` is still the main clue.
# It means that `db_session_for_tests` is being interpreted by FastAPI as a query parameter.
# This can only happen if `test_main.py` is somehow passing it into the client.post call,
# or if the dependency override is malformed in a way that tricks FastAPI.

# Let's try to make the override explicitly yield the type expected by FastAPI: Session.

# **Final Attempt to structure fixtures for FastAPI TestClient:**

# Core DB setup fixture:
@pytest.fixture(name="db_session", scope="function") # Use a simple name
def _db_session_fixture(): # Actual function name is internal (prefixed with _)
    # ... (SpatiaLite setup, Base.metadata.create_all etc. from test_db_session_fixture_setup) ...
    with test_engine.connect() as conn:
        try:
            load_spatialite(conn.connection) 
            print("geoalchemy2.load_spatialite() applied successfully within _db_session_fixture setup.")
            result = conn.execute(text("SELECT spatialite_version()")).scalar()
            print(f"SpatiaLite version from test_engine in fixture: {result}")
        except Exception as e:
            print(f"ERROR: geoalchemy2.load_spatialite() failed within _db_session_fixture setup: {e}")
            raise 
        
    Base.metadata.create_all(bind=test_engine) 
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Fixture to override get_db, taking the core db_session fixture
@pytest.fixture(name="override_get_db_dependency")
def _override_get_db_dependency(db_session: Session): # Request the core db_session fixture
    yield db_session


# Set the override once and globally for the TestClient
app.dependency_overrides[get_db] = _override_get_db_dependency # Assign the fixture function itself

# Create a TestClient instance (must be done after dependency overrides are set)
client = TestClient(app)

# --- Actual Tests ---

# Tests will request 'db_session' for direct DB interaction
def test_home_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "we are home"}

def test_db_session_can_add_user(db_session: Session): # Request 'db_session'
    from app.models import UserInfo 
    from main import Hasher 

    # Use db_session directly
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

def test_register_user_success(db_session: Session): # Request 'db_session'
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

    user_in_db = db_session.query(UserInfo).filter(UserInfo.user_email == "test@example.com").first() 
    print(f"User in DB after registration: {user_in_db}")
    assert user_in_db is not None
    assert user_in_db.username == "testuser"
    print("--- test_register_user_success finished ---")
# @pytest.fixture(name="test_db_session", scope="function") # Renamed for ultimate clarity
# def test_db_session_fixture_setup(): # This is the function that defines the fixture 'test_db_session'
#     # 1. Database creation (runs once per test function/session if scoped)
#     with test_engine.connect() as conn:
#         try:
#             load_spatialite(conn.connection) 
#             print("geoalchemy2.load_spatialite() applied successfully within test_db_session setup.")
#             result = conn.execute(text("SELECT spatialite_version()")).scalar()
#             print(f"SpatiaLite version from test_engine in fixture: {result}")
#         except Exception as e:
#             print(f"ERROR: geoalchemy2.load_spatialite() failed within test_db_session setup: {e}")
#             raise 
        
#     Base.metadata.create_all(bind=test_engine) # Creates tables for tests
    
#     # 2. Session creation (yields to the test, then closes)
#     db = TestingSessionLocal()
#     try:
#         yield db # This is the actual Session object provided to tests
#     finally:
#         db.close()

# def get_db_override():
#     pass

# @pytest.fixture(name="db_session_for_tests", scope="function") # Renamed for clarity
# def db_session_for_tests_fixture():
#     # Database setup logic moved from override_get_db
#     with test_engine.connect() as conn:
#         try:
#             load_spatialite(conn.connection)
#             print("geoalchemy2.load_spatialite() applied successfully within db_session_for_tests setup.")
#             conn.execute(text("SELECT spatialite_version()")).scalar()
#             print("SpatiaLite version check passed in db_session_for_tests fixture setup.")
#         except Exception as e:
#             print(f"ERROR: geoalchemy2.load_spatialite() failed within db_session_for_tests setup: {e}")
#             raise 
        
#     Base.metadata.create_all(bind=test_engine) 
    
#     db = TestingSessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @pytest.fixture(name="get_db_override_for_fastapi") # Renamed again for clarity
# def get_db_override_for_fastapi_fixture(db_session_for_tests):
#     yield db_session_for_tests

# #app.dependency_overrides[get_db] = get_test_db_override
# app.dependency_overrides[get_db] = get_db_override_for_fastapi_fixture


# # Create a TestClient instance
# client = TestClient(app)

# # --- Actual Tests ---
# def test_home_endpoint():
#     response = client.get("/")
#     assert response.status_code == 200
#     assert response.json() == {"message": "we are home"}

# def test_db_session_can_add_user(db_session_for_tests):
#     from app.models import UserInfo
#     from main import Hasher # Ensure Hasher is imported here if you don't use it elsewhere at top level

#     db_session = db_session_for_tests 

#     test_user_id = "test_user_id_123"
#     test_username = "directuser"
#     test_email = "direct@example.com"
#     test_password_hash = Hasher.get_password_hash("directpassword")

#     new_user = UserInfo(
#         user_id=test_user_id,
#         username=test_username,
#         user_email=test_email,
#         user_password=test_password_hash
#     )
#     db_session.add(new_user)
#     db_session.commit()

#     retrieved_user = db_session.query(UserInfo).filter(UserInfo.user_id == test_user_id).first()
#     assert retrieved_user is not None
#     assert retrieved_user.username == test_username
#     assert retrieved_user.user_email == test_email
#     print("db_session successfully added and retrieved a user directly.")


# def test_register_user_success(db_session_for_tests): # Keep this test
#     print("\n--- Starting test_register_user_success ---")
#     user_data = {
#         "username": "testuser",
#         "email": "test@example.com",
#         "password": "testpassword"
#     }
#     print(f"Attempting to register user with data: {user_data}")
#     response = client.post("/register", json=user_data)
#     print(f"Response status code: {response.status_code}")
#     print(f"Response JSON: {response.json()}")
#     assert response.status_code == 200
#     response_json = response.json()
#     assert "user_id" in response_json
#     assert response_json["username"] == "testuser"
#     assert response_json["user_email"] == "test@example.com"

#     # Verify user is in the database
#     db_session = db_session_for_tests # Assign for clarity
#     user_in_db = db_session.query(UserInfo).filter(UserInfo.user_email == "test@example.com").first() 
#     print(f"User in DB after registration: {user_in_db}")
#     assert user_in_db is not None
#     assert user_in_db.username == "testuser"
#     print("--- test_register_user_success finished ---")


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