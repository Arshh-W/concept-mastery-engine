from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
#dbconfig
connection_url = URL.create(
    drivername="postgresql+psycopg",
    username="postgres",
    password=os.getenv("DB_PASSWORD", "password"),
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", 5432)),
    database=os.getenv("DB_NAME", "concept_mastery"),
)

engine = create_engine(
    connection_url,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Importing all models so SQLAlchemy can see them before we create tables
    from models import ( 
        User,
        Competency,
        Challenge,
        MasteryState,
        Progress,
        GameSession,
        Achievement,
    )
    Base.metadata.create_all(bind=engine)
    print("All DB Tables Created.")