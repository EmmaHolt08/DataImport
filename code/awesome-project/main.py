from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any 
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import json


from sqlalchemy.sql import func
from geoalchemy2 import WKTElement
from sqlalchemy import Integer

from app.database import engine, Base, get_db
from app.models import DataImport
from app import router 

Base.metadata.create_all(bind=engine)

app = FastAPI()

# to give front end accesss to back end
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       
    allow_credentials=True,        
    allow_methods=["*"],          
    allow_headers=["*"],          
)

app.include_router(router.router)

@app.get('/')
def home():
    return{
        "message" : "we are home"
    }

class DataImportCreate(BaseModel):
    landslideID: str
    latitude: float
    longitude: float
    lsType: str     
    lsSource: str   
    impact: str
    wea13_id: Optional[str] = None
    wea13_type: Optional[str] = None
    user_id: str

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
    geometry: Any 
    user_id: str

    model_config = {'from_attributes': True}

#report form
@app.post("/data-imports/", response_model=DataImportResponse, status_code=status.HTTP_201_CREATED)
async def create_data_import(data_import: DataImportCreate, db: Session = Depends(get_db)):
    point_geom = WKTElement(f"POINT({data_import.longitude} {data_import.latitude})", srid=4326)

    db_data_import = DataImport(
        landslideid=data_import.landslideID,
        latitude=data_import.latitude,  
        longitude=data_import.longitude,
        lstype=data_import.lsType,
        lssource=data_import.lsSource,
        impact=data_import.impact,
        wea13_id=data_import.wea13_id,
        wea13_type=data_import.wea13_type,
        coords=point_geom,
        user_id=data_import.user_id,
    )

    db.add(db_data_import)
    db.commit()
    db.refresh(db_data_import)

    geometry_geojson_string = db.scalar(func.ST_AsGeoJSON(db_data_import.coords))
    geometry_geojson_dict = json.loads(geometry_geojson_string)

    return DataImportResponse.model_validate({
        "landslideID": db_data_import.landslideid,
        "latitude": db_data_import.latitude,
        "longitude": db_data_import.longitude,
        "lsType": db_data_import.lstype,
        "lsSource": db_data_import.lssource,
        "impact": db_data_import.impact,
        "wea13_id": db_data_import.wea13_id,
        "wea13_type": db_data_import.wea13_type,
        "geometry": geometry_geojson_dict,
        "user_id": db_data_import.user_id
    })

class MaxIDsResponse(BaseModel):
    max_landslide_id: Optional[int]

#for report form (gets the max ls ID)
@app.get("/get-max-ids/", response_model=MaxIDsResponse)
async def get_max_ids(db: Session = Depends(get_db)):
    
    max_landslide_id = db.query(func.max(DataImport.landslideid.cast(Integer))).scalar()

    if max_landslide_id is not None:
        try:
            max_landslide_id = int(max_landslide_id)
        except ValueError:
            max_landslide_id = None 
            print("Warning: max id is not valid integer.")


    return MaxIDsResponse(
        max_landslide_id=max_landslide_id,
    )

#query form
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
    user_id: Optional[str] = None,
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
        func.ST_AsGeoJSON(DataImport.coords).label('geometry_json_string'),
        DataImport.user_id.label('user_id')    )

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

    if user_id is not None:
        query = query.filter(DataImport.user_id == user_id)

    records = query.all()

    if not records:
        raise HTTPException(status_code=404, detail="No data import records found matching your criteria.")

    final_response_data = []
    for rec in records:
        rec_dict = rec._asdict() 
        
        # Parse the geometry string and assign it to the 'geometry' key
        # for the points on the home page/mapcoords
        if 'geometry_json_string' in rec_dict and rec_dict['geometry_json_string'] is not None:
            try:
                rec_dict['geometry'] = json.loads(rec_dict['geometry_json_string'])
            except json.JSONDecodeError:
                print(f"Error parsing geometry string in query_data_imports: {rec_dict['geometry_json_string']}")
                rec_dict['geometry'] = None 
        else:
            rec_dict['geometry'] = None 

        del rec_dict['geometry_json_string'] 
        
        final_response_data.append(DataImportResponse.model_validate(rec_dict))

    return final_response_data