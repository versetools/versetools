from globals import sc

localization_overrides = {
    "stanton1b_olp_001": "Ruptura OLP"
}

def translate(key: str):
    original_key = key

    if key.startswith("@"):
        key = key[1:]

    if key.lower() in localization_overrides:
        return localization_overrides[key.lower()]
    
    key = original_key
    result = sc.gettext(key)

    if result == key and key.lower().endswith(",p"):
        key = key[:-2]
        result = sc.gettext(key)

    return result
