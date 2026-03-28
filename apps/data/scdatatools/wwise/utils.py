import fnvhash


def wwise_id_for_string(name: str) -> int:
    """Returns the Wwise id from the given audio name"""
    if not isinstance(name, bytes):
        name = name.encode("utf-8")
    return fnvhash.fnv1_32(name.lower())
