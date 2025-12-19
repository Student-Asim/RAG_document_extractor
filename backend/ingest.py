import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore


# Pinecone SDK (new)
from pinecone import Pinecone as PineconeClient, ServerlessSpec

load_dotenv()

INDEX_NAME = "pdf-index"
UPLOAD_DIR = "data"

# Embeddings
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

# Initialize Pinecone client
pc = PineconeClient(api_key=os.getenv("PINECONE_API_KEY"))

# Create index if it does not exist
if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=768,  # Must match embedding dimension
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region=os.getenv("PINECONE_ENV", "us-west1-gcp"))
    )

# Initialize LangChain Pinecone vectorstore
vectorstore = PineconeVectorStore(
    index=pc.Index(INDEX_NAME),
    embedding=embeddings
)


def ingest_pdf(filename: str):
    """
    Ingest a PDF into Pinecone after splitting and embedding.
    """
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Load PDF
    loader = PyPDFLoader(file_path)
    docs = loader.load()

    # Split documents
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    splits = splitter.split_documents(docs)

    # Add metadata
    for doc in splits:
        if not doc.metadata:
            doc.metadata = {}
        doc.metadata["filename"] = filename

    # Upsert into Pinecone
    vectorstore.add_documents(splits)
    return True
