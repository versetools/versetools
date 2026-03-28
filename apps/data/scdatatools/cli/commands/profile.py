import io
import json

from nubia import command, argument

from . import common


@command(help="Dumps the default profile action map (keybinds) as JSON")
@common.sc_dir_argument
@argument("csv", description="Output as a CSV instead", aliases=["-c"])
def actionmap(
    sc_dir: str,
    csv: bool = False,
):
    sc = common.open_sc_dir(sc_dir)
    am = sc.default_profile.actionmap()

    if csv:
        out = io.StringIO(newline="")
        sc.default_profile.dump_actionmap_csv(out)
        print(out.getvalue())
    else:
        print(json.dumps(am, indent=4))
