import logging
import os
import shutil
import typing
from pathlib import Path
from subprocess import check_output, STDOUT, CalledProcessError
from tempfile import NamedTemporaryFile

from scdatatools.engine.cryxml import is_cryxmlb_file, dict_from_cryxml_string
from scdatatools.p4k import P4KInfo
from .bnk import BankManager

GAME_AUDIO_P4K_RELPATH = Path("Data/Libs/")
GAME_AUDIO_P4K_SEARCH = str(GAME_AUDIO_P4K_RELPATH / "GameAudio" / "*.xml")


class WwiseManager:
    def __init__(self, sc, ww2ogg=None, revorb=None):
        """
        Loads and manages all Wwise sound objects in a `StarCitizen` instance.

        :param sc: `StarCitizen` object
        :param ww2ogg: Optionally specify the ww2ogg command path. Otherwise it will try to be automatically found.
        :param revorb: Optionally specify the revorb command path. Otherwise it will try to be automatically found.
        """
        self.sc = sc
        self.wems = {Path(_.filename).stem: _ for _ in sc.p4k.search("Data/Sounds/wwise/*.wem")}
        self.bank_manager = BankManager()
        for bnk in self.sc.p4k.search("Data/Sounds/wwise/*.bnk"):
            self.bank_manager.load_bank(Path(bnk.filename).name, sc.p4k.open(bnk).read())

        self.preloads = {}
        self.triggers = {}
        self.external_sources = {}
        self._loaded_game_files = set()

        self.ww2ogg = ww2ogg if ww2ogg is not None else shutil.which("ww2ogg.exe")
        if self.ww2ogg is not None:
            self.ww2ogg = Path(self.ww2ogg)
        self.revorb = revorb if revorb is not None else shutil.which("revorb.exe")
        if self.revorb is not None:
            self.revorb = Path(self.revorb)

    def load_all_game_files(self):
        for p4kfile in self.sc.p4k.search(GAME_AUDIO_P4K_SEARCH):
            self.load_game_audio_file(self.sc.p4k.open(p4kfile))

    def load_game_audio_file(self, game_audio_file: typing.IO):
        game_audio_file.seek(0)
        raw = game_audio_file.read()

        if game_audio_file.name in self._loaded_game_files:
            return

        if is_cryxmlb_file(raw):
            try:
                ga = dict_from_cryxml_string(raw)
            except Exception as e:
                logging.exception(
                    f"Exception processing GameAudio file: {game_audio_file.name}",
                    exc_info=e,
                )
                return

            ga_name = Path(game_audio_file.name).stem
            self.preloads[ga_name] = {"triggers": {}, "external_sources": {}}

            # Process ATL Triggers
            atl_triggers = ga.get("ATLConfig", {}).get("AudioTriggers", {}).get("ATLTrigger", [])
            if isinstance(atl_triggers, dict):
                atl_triggers = [atl_triggers]  # if there is only one trigger it wont be a list
            for trigger in atl_triggers:
                atl_name = trigger.get("@atl_name", "")
                if atl_name:
                    self.preloads[ga_name]["triggers"][atl_name] = trigger
                    self.triggers[atl_name] = trigger

            # Process ATLExternalSources
            atl_ext_sources = (
                ga.get("ATLConfig", {}).get("AudioExternalSources", {}).get("ATLExternalSource", [])
            )
            if isinstance(atl_ext_sources, dict):
                atl_ext_sources = [
                    atl_ext_sources
                ]  # if there is only one ext_source it wont be a list
            for ext_source in atl_ext_sources:
                atl_name = ext_source.get("@atl_name", "")
                if atl_name:
                    self.preloads[ga_name]["external_sources"][atl_name] = ext_source
                    self.external_sources[atl_name] = ext_source

            self._loaded_game_files.add(game_audio_file.name)

    def wems_for_atl_name(self, atl_name: str) -> typing.Dict[str, P4KInfo]:
        if not atl_name:
            return {}
        if atl_name in self.external_sources:
            wf = self.external_sources[atl_name]["ATLExternalSourceEntry"]["WwiseExternalSource"][
                "@wwise_filename"
            ]
            wf_name = Path(wf).stem
            return {wf_name: self.wems[wf_name]}
        wem_ids = self.bank_manager.wems_for_atl_name(atl_name)
        return {str(_): self.wems[str(_)] for _ in wem_ids if str(_) in self.wems}

    def convert_wem(
        self,
        wem_bytes_or_id: typing.Union[bytes, str, int, P4KInfo],
        return_file: bool = False,
    ) -> typing.Union[bytes, Path]:
        """
        Converts the given `wem` buffer into `ogg`

        :param wem_bytes_or_id: Raw `wem` bytes object, the `wem` id that will be looked up from the WwiseManager, or
            a P4KInfo from the sc.p4k.
        :param return_file: Return the path to the temporary file that was used for conversion instead of the bytes
        :raises Exception: If there was an error converting the wem
        :return: Converted `ogg` bytes object or a `Path` if `return_file` is true
        """
        if not self.ww2ogg:
            raise ValueError(
                f"Could not find ww2ogg, ensure it exists in your system path, set the ww2ogg "
                f"attribute for the Wwise manager"
            )
        if not self.revorb:
            raise ValueError(
                f"Could not find revorb, ensure it exists in your system path, set the revorb "
                f"attribute for the Wwise manager"
            )

        _ = NamedTemporaryFile(suffix=f".wem", delete=False)
        tmpout = Path(_.name)
        oggout = Path(tmpout.parent / f"{tmpout.stem}.ogg")
        _.close()

        if isinstance(wem_bytes_or_id, (str, int)):
            with self.sc.p4k.open(self.wems[str(wem_bytes_or_id)]) as source, tmpout.open(
                "wb"
            ) as t:
                shutil.copyfileobj(source, t)
        elif isinstance(wem_bytes_or_id, P4KInfo):
            with self.sc.p4k.open(wem_bytes_or_id) as source, tmpout.open("wb") as t:
                shutil.copyfileobj(source, t)
        else:
            with tmpout.open("wb") as t:
                t.write(wem_bytes_or_id)

        curdir = os.getcwd()
        try:
            os.chdir(self.ww2ogg.parent.absolute())
            check_output(
                f"{self.ww2ogg} {tmpout.absolute()} -o {oggout.absolute()} "
                f"--pcb packed_codebooks_aoTuV_603.bin",
                stderr=STDOUT,
                shell=True,
            )
            check_output(f"{self.revorb} {oggout}", stderr=STDOUT, shell=True)
            if not return_file:
                with oggout.open("rb") as o:
                    return o.read()
            return oggout
        except CalledProcessError as e:
            raise Exception(f"Error converting wem: {e}")
        finally:
            os.chdir(curdir)
            tmpout.unlink(missing_ok=True)
            if not return_file:
                oggout.unlink(missing_ok=True)
