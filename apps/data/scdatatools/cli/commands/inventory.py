import json
import sys
from pathlib import Path

from nubia import command, argument

from scdatatools.sc import StarCitizen


@command(
    help="Dumps a JSON object of every file in the Star Citizen directory and archives (recursively). This can be "
    "used to compare different versions of Star Citizen"
)
@argument("scdir", description="StarCitizen Game Folder", positional=True)
@argument("outfile", description="Output file name", positional=True)
def inventory(scdir: Path, outfile: Path):
    sc = StarCitizen(scdir)
    i = sc.generate_inventory()

    try:
        with open(outfile, "w") as o:
            # default=str will handle the datetime objects
            print(f"Writing {outfile.name}")
            json.dump(i, o, indent=2, default=str)
    except KeyboardInterrupt:
        sys.stderr.write(f"\nExiting, the inventory file may not be complete...\n\n")
