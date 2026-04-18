import json
from pathlib import Path
from globals import sc, EMPTY_GUID
from translations import translate

def export_blueprints():
    blueprint_records = sc.datacore.search_filename("libs/foundry/records/crafting/blueprints", True, "startswith")

    blueprints = []


if __name__ == "__main__":
    export_blueprints()