import os
import shutil
import json
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ingest import ingest_pdf

from langchain.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_pinecone import PineconeVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings  # updated import

from pinecone import Pinecone, ServerlessSpec

# === FastAPI ===
app = FastAPI()

UPLOAD_DIR = "data"
INDEX_NAME = "pdf-index"
os.makedirs(UPLOAD_DIR, exist_ok=True)

load_dotenv()

# === Embeddings (768-dim) ===
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

# === Pinecone client (new SDK) ===
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Create index if it doesn't exist
if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-west1")
    )

# === Vectorstore ===
vectorstore = PineconeVectorStore(
    index_name=INDEX_NAME,
    embedding=embeddings,
    text_key="text"
)

# === LLM ===
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

SYSTEM_PROMPT = """
You are a helpful assistant. Use only the provided context to answer.

<context>
{context}
</context>
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{input}")
])

doc_chain = create_stuff_documents_chain(llm, prompt)

# === Serve React frontend ===
app.mount("/static", StaticFiles(directory="frontend_build/static"), name="static")

@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    index_path = os.path.join("frontend_build", "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse("<h1>React build not found!</h1>", status_code=404)

# === CORS ===
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Request model ===
class QueryRequest(BaseModel):
    question: str
    filename: str = None

# === Endpoints ===
@app.get("/uploaded_pdfs")
async def uploaded_pdfs():
    files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith(".pdf")]
    return {"pdfs": files}

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    ingest_pdf(file.filename)

    return {"filename": file.filename, "message": "Uploaded and ingested successfully"}

@app.post("/ask")
async def ask(req: QueryRequest):
    retriever = vectorstore.as_retriever(
        search_kwargs={"k": 4, "filter": {"filename": req.filename}} if req.filename else {"k": 4}
    )
    rag_chain = create_retrieval_chain(retriever, doc_chain)
    res = rag_chain.invoke({"input": req.question})

    answer_text = res.get("answer", "")
    try:
        structured_answer = json.loads(answer_text) if not isinstance(answer_text, dict) else answer_text
    except:
        structured_answer = {"Answer": str(answer_text) or "No answer received"}

    summary = " ".join(req.question.split()[:3]) + ("..." if len(req.question.split()) > 3 else "")
    return {"answer": structured_answer, "summary": summary}

# === Run server ===
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
