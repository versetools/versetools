import json
from items import get_all_items

def export_items():
    items = get_all_items()

    print("Found", len(items), "items")

    with open("out/items.json", "w") as file:
        json.dump(items, file, indent=2)


if __name__ == "__main__":
    export_items()