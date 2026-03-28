def normalize_material_name(mat_name):
    if "_mtl_" in mat_name:
        # normalize mtl library name
        mtl_file, mtl = mat_name.split("_mtl_")
        norm_mat_name = f"{mtl_file.lower()}_mtl_{mtl}"
    else:
        norm_mat_name = mat_name

    if "." in norm_mat_name:
        # remove .NNN
        base_mat_name, _ = norm_mat_name.rsplit(".", maxsplit=1)
        norm_mat_name = base_mat_name if _.isdigit() else norm_mat_name

    norm_mat_name = norm_mat_name.replace(" ", "_")

    return norm_mat_name
