"""Build the local entry page with its styles and scripts included.

Run `python3 build-local.py` after editing the HTML template, CSS, or JavaScript.
The resulting index.html opens directly without a server or separate script loads.
"""

from pathlib import Path
import re


def build():
    folder = Path(__file__).resolve().parent
    page = (folder / "page.template.html").read_text(encoding="utf-8")
    scripts = []

    def style(match):
        name = match.group(1)
        css = (folder / name).read_text(encoding="utf-8")
        if "</style" in css.lower():
            raise ValueError(f"Unexpected closing style tag in {name}")
        return f'<style data-source="{name}">\n{css}\n</style>'

    def script(match):
        name = match.group(1)
        code = (folder / name).read_text(encoding="utf-8")
        if "</script" in code.lower():
            raise ValueError(f"Unexpected closing script tag in {name}")
        scripts.append(f'<script data-source="{name}">\n{code}\n</script>')
        return ""

    page = re.sub(r'<link rel="stylesheet" href="([^"?#]+)">', style, page)
    page = re.sub(r'<script defer src="([^"?#]+)"></script>', script, page)
    if len(scripts) != 5:
        raise ValueError("Expected the five application scripts in the page template")
    page = page.replace("</body>", "\n".join(scripts) + "\n</body>")
    (folder / "index.html").write_text(page, encoding="utf-8")
    print("Built index.html with all page styles and scripts included.")


if __name__ == "__main__":
    build()
