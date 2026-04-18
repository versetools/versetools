from typing import Union
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

def translation_ref(key: str, override_value: Union[str, None] = None):
    return {
        "translationKey": key,
        "value": override_value if override_value else translate(key)
    }

def missing_translation(ref: dict):
    normalised_translsation_key: str = ref["translationKey"].lower()
    if normalised_translsation_key.startswith("@"):
        normalised_translsation_key = normalised_translsation_key[1:]

    if normalised_translsation_key in ["#!missing", "loc_empty", "loc_placeholder"]:
        return True

    return ref["value"] == ref["translationKey"]