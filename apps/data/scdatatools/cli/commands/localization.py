import io
import logging
import re
import sys
import typing
from csv import DictWriter
from pathlib import Path

from nubia import command, argument
from rich import get_console, table

from . import common
from ..utils import track

logger = logging.getLogger(__name__)


@command(aliases=["loc"])
class localization:
    """Localization utilities"""

    @command()
    @common.sc_dir_argument
    @argument(
        "languages",
        description="Languages to translate to from the available languages. Defaults to english",
        aliases=["-l"],
    )
    @argument("text", positional=True, description="The text to translate")
    def translate(
        self,
        sc_dir: str,
        text: str,
        languages: typing.List[str] = None,
    ):
        """Translate a give text using the p4k's localization database."""
        sc = common.open_sc_dir(sc_dir)
        languages = languages or [sc.localization.default_language]

        translations = []
        for l in languages:
            l = l.casefold()
            if l not in sc.localization.languages:
                continue
            translations.append(sc.localization.gettext(text, language=l, default_response=""))

        if len(translations) == 1:
            print(translations[0])
            sys.exit()

        t = table.Table()
        for lang in languages:
            t.add_column(lang)
        t.add_row(*translations)
        get_console().print(t)

    @command
    @common.sc_dir_argument
    @argument(
        "filter",
        aliases=["-f"],
        description="Regex filter to down-select the printed translations. The filter will apply to the key names, "
        "as well as the translations for the key",
    )
    @argument(
        "languages",
        description="Languages to display to from the available languages. Defaults to all",
        aliases=["-l"],
    )
    def ls(
        self,
        sc_dir: str,
        languages: typing.List[str] = None,
        filter: str = "",
    ):
        """List translations"""
        sc = common.open_sc_dir(sc_dir)

        selected_languages = []
        if not languages:
            selected_languages = sc.localization.languages
            selected_languages.remove(sc.localization.default_language)
            selected_languages.insert(0, sc.localization.default_language)
        else:
            for lang in languages:
                lang = lang.casefold()
                if lang in sc.localization.languages:
                    selected_languages.append(lang)
                else:
                    logger.error(f"invalid language {lang}")
        if not selected_languages:
            return

        t = table.Table()
        t.add_column("key")
        for lang in selected_languages:
            t.add_column(lang)

        filter = re.compile(filter.casefold()) if filter else None
        for k in sc.localization.keys:
            row = [k] + [sc.localization.gettext(k, l, "") for l in selected_languages]
            if filter is None or filter.search("".join(row).casefold()):
                t.add_row(*row)
        get_console().print(t)

    @command
    @common.sc_dir_argument
    @argument(
        "filter",
        aliases=["-f"],
        description="Regex filter to down-select the printed translations. The filter will apply to the key names, "
        "as well as the translations for the key",
    )
    @argument(
        "languages",
        description="Languages to display to from the available languages. Defaults to all",
        aliases=["-l"],
    )
    @argument(
        "output",
        description='Output filename or "-" to print to the screen',
        positional=True,
    )
    def export(
        self,
        sc_dir: str,
        output: str,
        languages: typing.List[str] = None,
        filter: str = "",
    ):
        """Export translations to  csv"""
        sc = common.open_sc_dir(sc_dir)
        if output == "-":
            outfile = io.StringIO(newline="")
        else:
            outfile = Path(output).open("w", newline="", encoding="utf-8")
        selected_languages = []

        if not languages:
            selected_languages = sc.localization.languages
            selected_languages.remove(sc.localization.default_language)
            selected_languages.insert(0, sc.localization.default_language)

        try:
            writer = DictWriter(outfile, fieldnames=["key"] + selected_languages)
            writer.writeheader()

            filter = re.compile(filter.casefold()) if filter else None
            for k in track(sc.localization.keys, description="Exporting translation"):
                row = dict(
                    **{"key": k},
                    **{l: sc.localization.gettext(k, l, "") for l in selected_languages},
                )
                if filter is None or filter.search(str(row).casefold()):
                    writer.writerow(row)

            if output == "-":
                print(outfile.getvalue())
        finally:
            outfile.close()
