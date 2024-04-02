from fastapi import FastAPI
from algoliasearch.search_client import SearchClient
import os
from dotenv import load_dotenv
from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import BaseTool, StructuredTool, tool
from langchain_openai import ChatOpenAI
from langchain import hub
from langchain.agents import AgentExecutor, create_openai_tools_agent
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, HumanMessage
import models
from database import SessionLocal, engine
import schemas
from sqlalchemy.orm import Session
from fastapi import FastAPI, status, HTTPException, Depends
from typing import List
from sqlalchemy import desc, asc

load_dotenv()
app = FastAPI()

def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

models.Base.metadata.create_all(engine)

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = SearchClient.create(os.getenv("ALGOLIA_APP_ID"), os.getenv("ALGOLIA_API_KEY"))
index = client.init_index("hebbia")

@tool
def search(query: str):
    """search algolia index"""
    results = index.search(query)
                        #    , {'offset': 0, 'length': 3})
    # , {'relevancyStrictness': 70, 'attributesToHighlight': ['content', 'description']})
    # print(results["hits"])
    # TODO: don't just return the first result
    print(results["hits"][0]["_highlightResult"]["text"])
    return results["hits"][0]

llm = ChatOpenAI(model="gpt-3.5-turbo-16k-0613", temperature=0)
prompt = hub.pull("hwchase17/openai-tools-agent")
tools = [search]
agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, return_intermediate_steps=True)

@app.get("/chat/{thread_id}/{query}")
async def search(thread_id: str, query: str, session: Session = Depends(get_session)):
    messages = await getMessages(thread_id, session)
    chat_history = [HumanMessage(content=message.content) if message.sender==0 else AIMessage(content=message.content) for message in messages ]
    answer = agent_executor.invoke({"input": query, "chat_history": chat_history})
    humanMessage = models.Message(sender="human", content=query, thread_id=thread_id)
    session.add(humanMessage)
    session.commit()
    session.refresh(humanMessage)
    source = None
    if (len(answer["intermediate_steps"]) > 0 and len(answer["intermediate_steps"][0]) > 0):
        source_info = answer["intermediate_steps"][0][1]
        text = source_info['text']
        title = source_info['title']
        objId = source_info['objectID']
        source = models.AnswerSource(text=text, title=title, algolia_obj_id=objId)
        session.add(source)
        session.commit()
        session.refresh(source)
        print(source)
    source_id = source.id if source else None
    aiMessage = models.Message(sender="ai", content=answer["output"], thread_id=thread_id, source_id=source_id)
    session.add(aiMessage)
    session.commit()
    session.refresh(aiMessage)
    return answer

@app.post("/new", response_model=schemas.Thread)
def createThread(session: Session = Depends(get_session)):
    thread = models.Thread()
    session.add(thread)
    session.commit()
    session.refresh(thread)
    return thread

@app.get("/threads", response_model=List[schemas.Thread])
async def getThreads(session: Session = Depends(get_session)):
    return session.query(models.Thread).all()

@app.get("/messages/{thread_id}", response_model=List[schemas.Message])
async def getMessages(thread_id: str, session: Session = Depends(get_session)):
    results = session.query(models.Message).filter(models.Message.thread_id == thread_id).order_by(asc(models.Message.timestamp)).all()
    # results = session.query(models.Message, models.AnswerSource).filter(models.Message.thread_id == thread_id).join(models.AnswerSource, models.AnswerSource.id == models.Message.source_id).order_by(asc(models.Message.timestamp)).all()
    # print(session.query(models.AnswerSource).get(message.source_id).all() for message in results)
    print(results)
    return results
