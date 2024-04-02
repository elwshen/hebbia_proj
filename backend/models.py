from sqlalchemy import String, Boolean, Integer, Column, text, TIMESTAMP, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()
metadata = Base.metadata

class SenderRole(enum.Enum):
    human = 0
    ai = 1

class Thread(Base):
    __tablename__ = "threads"
    id = Column(Integer, primary_key=True, nullable=False)

class AnswerSource(Base):
    __tablename__ = "sources"
    id = Column(Integer, primary_key=True, nullable=False)
    text = Column(String, nullable=False)
    title = Column(String, nullable=False)
    algolia_obj_id = Column(String, nullable=True)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, nullable=False)
    sender = Column(Enum(SenderRole), nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    thread_id = Column(Integer, ForeignKey(Thread.id), nullable=False)
    source_id = Column(Integer, ForeignKey(AnswerSource.id), nullable=True)


