import concurrent.futures
import logging
import shutil
import subprocess
import time
import typing
from pathlib import Path

from scdatatools import plugins

logger = logging.getLogger(__name__)
CGF_CONVERTER_MODEL_EXTS = ["cga", "cgf", "chr", "skin"]
CGF_CONVERTER_TIMEOUT = 5 * 60  # assume cgf converter is stuck after this much time
CGF_CONVERTER_DEFAULT_OPTS = (
    '-en "$physics_proxy" -em proxy -em nocollision_faces -prefixmatnames -notex -dae'
)
CGF_CONVERTER = shutil.which("cgf-converter")


if typing.TYPE_CHECKING:
    from scdatatools.p4k import P4KInfo


@plugins.register
class CGFModelConverter(plugins.P4KConverterPlugin):
    name = "cgf_converter"
    display_name = "CGF-Converter"
    handles = CGF_CONVERTER_MODEL_EXTS

    @classmethod
    def convert(
        cls,
        members: typing.List["P4KInfo"],
        path: typing.Union[Path, str],
        overwrite: bool = False,
        save_to: bool = False,
        options: typing.Dict = None,
        monitor: typing.Callable = None,
    ) -> typing.Tuple[typing.List["P4KInfo"], typing.List[Path]]:

        options = options or {}
        cgf_converter = options.get("cgf_converter_bin", CGF_CONVERTER)
        cgf_converter_opts = options.get("cgf_converter_opts", "")

        if not cgf_converter:
            cgf_converter = CGF_CONVERTER

        if not cgf_converter_opts:
            cgf_converter_opts = CGF_CONVERTER_DEFAULT_OPTS

        unhandled_members = []
        models_to_convert = []
        extracted_paths = []

        # make sure we catch the `m` versions of files too
        handled_exts = set(cls.handles + [f"{_}m" for _ in cls.handles])

        while members:
            member = members.pop()
            ext = member.filename.split(".", maxsplit=1)[-1].casefold()

            if ext not in handled_exts:
                unhandled_members.append(member)
            else:
                models_to_convert.append(member)

        # files need to be extracted first, so do that now
        if models_to_convert:
            extracted_models = models_to_convert[0].p4k.extractall(
                path,
                members=models_to_convert,
                overwrite=overwrite,
                save_to=save_to,
                monitor=monitor,
            )
        else:
            extracted_models = []
        extracted_paths.extend(extracted_models)

        def _do_model_convert(model_file):
            cgf_cmd = (
                f'"{cgf_converter}" {cgf_converter_opts} "{model_file}" -objectdir "{obj_dir}"'
            )
            cgf = subprocess.Popen(
                cgf_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT
            )

            start_time = time.time()
            while (time.time() - start_time) < CGF_CONVERTER_TIMEOUT:
                if cgf.poll() is not None:
                    break
                time.sleep(1)
            else:
                # timed out, kill the process
                cgf.terminate()
            if cgf.returncode != 0:
                errmsg = cgf.stdout.read().decode("utf-8")
                if "is being used by another process" in errmsg.lower():
                    return []  # someone else already picked up this file, ignore the error
                return [
                    (
                        None,
                        f"model conversion failed for {model_file}: \n{errmsg}\n\n",
                        logging.ERROR,
                    )
                ]
            return [(model_file, f"converted {model_file}", logging.INFO)]

        obj_dir = path if save_to else path / "Data"
        i = 0
        total = 0
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = []
            for model_file in extracted_models:
                if model_file.lower()[-1] == "m":
                    continue  # skip the `m` files here

                model_file = Path(model_file)
                if model_file.suffix == ".cgf" and model_file.with_suffix(".cga").is_file():
                    continue  # skip converting cgf files if the cga equivalent is available
                futures.append(executor.submit(_do_model_convert, model_file=model_file))
                total += 1
            for future in concurrent.futures.as_completed(futures):
                for ret in future.result():
                    i += 1
                    if monitor is not None:
                        monitor(msg=ret[1], level=ret[2])
                    if ret[0] is not None and ret[0].is_file():
                        extracted_paths.append(ret[0].with_suffix(".dae").as_posix())

        return unhandled_members, extracted_paths
