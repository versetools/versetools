import os
import time
from convex import ConvexClient
from dotenv import load_dotenv
from scdatatools.sc import StarCitizen

EMPTY_GUID = "00000000-0000-0000-0000-000000000000"
UNIVERSE_GUID = "d4aff31c-4a4e-432b-adf2-464369a7fa7a"

load_dotenv(".env.local")

STAR_CITIZEN_INSTALL_PATH = os.getenv("STAR_CITIZEN_INSTALL_PATH")
CONVEX_URL = os.getenv("CONVEX_URL")

print("Loading StarCitizen data.p4k...")
_load_start = time.time()
sc = StarCitizen(STAR_CITIZEN_INSTALL_PATH)
sc.p4k.expand_subarchives()
sc.datacore
print("Loaded data.p4k in", round((time.time() - _load_start) * 100) / 100, "seconds")

# client = ConvexClient(CONVEX_URL)