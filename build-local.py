"""Rebuild the offline entry page from canonical JSON, HTML, CSS and JS."""
from pathlib import Path
import base64
import json
import re

def build():
    root = Path(__file__).resolve().parent
    chunks = []
    for filename, variable in [("world.json", "FutureWorld"), ("personas.json", "FuturePersonas"), ("onboarding.json", "FutureOnboardingData"), ("quiz.json", "FutureQuizData"), ("presentation.json", "FuturePresentation"), ("chat-replies.json", "FutureChatReplies")]:
        value = json.loads((root / "content" / filename).read_text())
        chunks.append("window." + variable + " = " + json.dumps(value, ensure_ascii=False).replace("</", "<\\/") + ";")
    (root / "world-data.js").write_text("\n".join(chunks), encoding="utf-8")
    icons = {p.stem:p.read_text() for p in (root / "assets/icons").glob("*.svg")}
    (root / "icons-data.js").write_text("window.FutureIcons = " + json.dumps(icons) + ";\n", encoding="utf-8")
    page = (root / "page.template.html").read_text()
    scripts = []
    def style(match):
        name = match.group(1)
        css = (root / name).read_text()
        def font(m):
            return "url('data:font/woff2;base64," + base64.b64encode((root / m.group(1)).read_bytes()).decode() + "')"
        css = re.sub(r"url\('([^']+\.woff2)'\)", font, css)
        if "</style" in css.lower():
            raise ValueError("Unexpected closing style tag")
        return f'<style data-source="{name}">\n{css}\n</style>'
    def script(match):
        name = match.group(1)
        code = (root / name).read_text()
        if "</script" in code.lower():
            raise ValueError("Unexpected closing script tag in " + name)
        scripts.append(f'<script data-source="{name}">\n{code}\n</script>')
        return ""
    page = re.sub(r'<link rel="stylesheet" href="([^"?#]+)">', style, page)
    page = re.sub(r'<script defer src="([^"?#]+)"></script>', script, page)
    (root / "index.html").write_text(page.replace("</body>", "\n".join(scripts) + "\n</body>"), encoding="utf-8")
    print("Built offline index.html from canonical content and " + str(len(scripts)) + " scripts.")

if __name__ == "__main__":
    build()
