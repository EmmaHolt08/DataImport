# app/models.py
from sqlalchemy import Column, Integer, String, Text
from .database import Base # Import Base from your database.py in the same package
from geoalchemy2 import Geometry # This is for generic geometry columns

# This class represents the 'products' table in your PostgreSQL database
class DataImport(Base):
    __tablename__ = "data_import" # The actual table name in your database

    # columns for the table

    # id: Primary key
    landslideid = Column(String, primary_key=True, index=True)

    latitude = Column(String)

    longitude = Column(String)

    lstype = Column(String)

    lssource = Column(String)

    impact = Column(String)

    wea13_id = Column(Integer)

    wea13_type = Column(String)

    coords = Column(Geometry(geometry_type='POINT', srid=4326))


    # A helpful representation for debugging and printing Product objects
    def __repr__(self):
        return (f"<DataImport(landslideid={self.landslideid}, latitude={self.latitude}, longitude={self.longitude},"
                f"lstype={self.lstype}, lssource={self.lssource}, impact={self.impact}, wea13_id={self.wea13_id},"
                f"wea13_type={self.wea13_type}, coords={self.coords})>")