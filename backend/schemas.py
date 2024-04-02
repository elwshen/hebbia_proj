from typing import Optional
from models import SenderRole
from pydantic import BaseModel

class Thread(BaseModel):
    id: int

class Message(BaseModel):
    id: int
    sender: SenderRole
    content: str
    thread_id: int
    # title: Optional[str] = None

class AnswerSource(BaseModel):
    id: int
    text: str
    title: str
    algolia_obj_id: str


