from pymongo import MongoClient
from app.config import MONGO_URI, MONGO_DB

client: MongoClient = None
db = None


def connect_mongo():
    global client, db
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    return db


def get_mongo():
    return db


def close_mongo():
    global client
    if client:
        client.close()


def check_mongo():
    client.admin.command("ping")
