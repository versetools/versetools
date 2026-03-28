import logging
from pathlib import Path

from scdatatools.p4k import P4KFile

logger = logging.getLogger(__name__)


class SCLocalization:
    """Utilities for converting to localized strings"""

    def __init__(self, p4k_or_sc, default_language="english", cache_dir=None):
        self.default_language = default_language
        self.languages = []
        self.translations = {}
        self.keys = set()

        def _get_p4k():
            if isinstance(p4k_or_sc, P4KFile):
                return p4k_or_sc
            return p4k_or_sc.p4k

        if cache_dir is not None:
            logger.debug(f"Using localization cache {cache_dir}")
            if not (lcache := Path(cache_dir) / "localization").is_dir():
                logger.debug(f"Building localization cache")
                p4k = _get_p4k()
                lcache.mkdir(parents=True)
                p4k.extractall(
                    members=p4k.search("Data/Localization/*/global.ini"), path=lcache, monitor=None
                )
            localization_files = lcache.rglob("**/global.ini")
        else:
            p4k = _get_p4k()
            localization_files = p4k.search("Data/Localization/*/global.ini")

        lower_key = lambda trans: (trans[0].lower(), trans[1])
        for l in localization_files:
            logging.debug(f"processing {l}")
            try:
                with l.open("rb") as f:
                    lang = Path(f.name).parts[-2]
                    content = f.read()
                    content.lstrip(b'\xef\xbb\xbf')  # TODO: unknown header/version? does not seem to correlate to size
                    self.languages.append(lang)
                    self.translations[lang] = dict(
                        lower_key(_.split("=", 1))
                        for _ in content.decode("utf-8", errors="ignore").split("\r\n")
                        if "=" in _
                    )
                    self.keys.update(self.translations[lang].keys())
            except UnicodeDecodeError:
                logger.error(f'failed to load localization for {l.filename}')
        self.keys = sorted(self.keys)

    def gettext(self, key, language=None, default_response=None) -> str:
        """Get the translation for `key` from the given language (or the default language if `None`).

        :param key: The key to lookup
        :param language: The language to get the translation from. Uses `default_language` if None
        :param default_response: The value to be returned if no translation exists for the given `key`. Returns the
            `key` if `None`
        """
        language = (
            self.default_language
            if (language is None or language not in self.languages)
            else language
        )
        key = key.lower()
        trans = self.translations.get(language, {}).get(key, "")
        if not trans and key.startswith("@"):
            trans = self.translations.get(language, {}).get(key[1:], "")
        if trans:
            return trans
        elif default_response is not None:
            return default_response
        return key
