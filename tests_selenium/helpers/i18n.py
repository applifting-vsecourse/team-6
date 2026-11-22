"""Resolves UI text from the frontend's own translation files.

Selectors that match on visible text use t("group.key") instead of a hardcoded
Czech string, so a copy change (like the move to informal Czech in #157) does
not break the suite. Only a renamed or removed key does.
"""

import json
import os
import re
from functools import lru_cache

LOCALES_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "apps", "frontend", "src", "i18n", "locales"
)
LANG = os.environ.get("TEST_LANG", "cs")


@lru_cache(maxsize=None)
def _messages(lang):
    with open(os.path.join(LOCALES_DIR, f"{lang}.json"), encoding="utf-8") as f:
        return json.load(f)


def _plural_suffix(lang, count):
    if lang == "cs":
        if count == 1:
            return "_one"
        if 2 <= count <= 4:
            return "_few"
        return "_other"
    return "_one" if count == 1 else "_other"


def t(key, lang=None, **params):
    """Looks up `key` (dot path) and fills in {{params}}, like i18next does.

    Pass `count` for plural keys (key_one / key_few / key_other).
    Rich-text tags such as <coc>…</coc> are stripped, leaving the visible text.
    """
    lang = lang or LANG
    node = _messages(lang)
    parts = key.split(".")
    for i, part in enumerate(parts):
        if i == len(parts) - 1 and "count" in params and isinstance(node, dict):
            plural = part + _plural_suffix(lang, params["count"])
            if plural in node:
                part = plural
        if not isinstance(node, dict) or part not in node:
            raise KeyError(f"Missing translation key '{key}' in {lang}.json")
        node = node[part]
    if not isinstance(node, str):
        raise KeyError(f"Translation key '{key}' is not a string")
    text = re.sub(r"\{\{\s*(\w+)\s*\}\}", lambda m: str(params.get(m.group(1), m.group(0))), node)
    return re.sub(r"</?\w+>", "", text)


def xp(text):
    """Quotes `text` as an XPath string literal, whatever quotes it contains."""
    if "'" not in text:
        return f"'{text}'"
    if '"' not in text:
        return f'"{text}"'
    return "concat(" + ", \"'\", ".join(f"'{p}'" for p in text.split("'")) + ")"
