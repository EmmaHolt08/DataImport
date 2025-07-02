from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.sql import func
from geoalchemy2 import WKTElement

from app.database import engine, Base, get_db
from app.models import DataImport

import router

Base.metadata.create_all(bind=engine)

app = FastAPI()

# to give front end accesss to back end
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.include_router(router.router)

@app.get('/')
def home():
    return{
        "message" : "we are home"
    }
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       
    allow_credentials=True,        
    allow_methods=["*"],          
    allow_headers=["*"],          
)

class DataImportCreate(BaseModel):
    landslideID: str
    latitude: float
    longitude: float
    lsType: str     
    lsSource: str   
    impact: str
    wea13_id: Optional[str]
    wea13_type: Optional[str]
    # The coords (geometry) will be generated from latitude/longitude

# Data model for data you will send in API responses
class DataImportResponse(BaseModel):
    landslideID: str
    latitude: float
    longitude: float
    lsType: str     
    lsSource: str   
    impact: str
    wea13_id: Optional[str]
    wea13_type: Optional[str]
    # Geometry returned as WKT string
    geometry: str

    model_config = {'from_attributes': True}

@app.get("/query-data-imports/", response_model=List[DataImportResponse])
async def query_data_imports(
    # Query parameters 
    search_landslideid: Optional[str] = None,
    min_latitude: Optional[float] = None,
    max_latitude: Optional[float] = None,
    min_longitude:Optional[float] = None,
    max_longitude:Optional[float] = None,
    landslide_type: Optional[str] = None,
    landslide_source: Optional[str] = None,
    impact: Optional[str] = None,
    wea13_id: Optional[str] = None,
    wea13_type: Optional[str] = None,
    coordinates: Optional[str] = None,
    db: Session = Depends(get_db)
):
    
    query = db.query(
        DataImport.landslideid.label('landslideID'),
        DataImport.latitude.label('latitude'),
        DataImport.longitude.label('longitude'),
        DataImport.lstype.label('lsType'),          
        DataImport.lssource.label('lsSource'),       
        DataImport.impact.label('impact'),
        DataImport.wea13_id.label('wea13_id'),
        DataImport.wea13_type.label('wea13_type'),
        func.ST_AsText(DataImport.coords).label('geometry')
    )

    if search_landslideid:
        query = query.filter(DataImport.landslideid == search_landslideid)

    if min_latitude is not None:
        query = query.filter(DataImport.latitude >= min_latitude)

    if max_latitude is not None:
        query = query.filter(DataImport.latitude <= max_latitude)

    if min_longitude is not None:
        query = query.filter(DataImport.longitude >= min_longitude)

    if max_longitude is not None:
        query = query.filter(DataImport.longitude <= max_longitude)

    if landslide_type is not None:
        query = query.filter(DataImport.lstype == landslide_type)

    if landslide_source is not None:
        query  = query.filter(DataImport.lssource == landslide_source)

    if impact is not None:
        query = query.filter(DataImport.impact == impact)

    if wea13_id is not None:
        query = query.filter(DataImport.wea13_id == wea13_id)

    if wea13_type is not None:
        query = query.filter(DataImport.wea13_type == wea13_type)

    if coordinates is not None:
        lon, lat = map(float, coordinates.split())
        point_geom = WKTElement(f"POINT({lon} {lat})", srid=4326)
        query = query.filter(func.ST_Equals(DataImport.coords, point_geom))

    records = query.all()

    if not records:
        raise HTTPException(status_code=404, detail="No data import records found matching your criteria.")

    return [DataImportResponse.model_validate(rec) for rec in records]
