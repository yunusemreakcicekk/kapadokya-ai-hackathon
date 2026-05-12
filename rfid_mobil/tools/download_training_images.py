from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json
import sys
import time


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "training_data"
USER_AGENT = "rfid_mobil_training_dataset/1.0 (Kapadokya Hackathon 2026)"

QUERIES = {
    "Comlek": [
        "handmade clay pot pottery",
        "Turkish pottery pot",
        "earthenware pot",
    ],
    "Hali": [
        "Turkish carpet",
        "oriental carpet",
        "woven carpet",
    ],
    "Kilim": [
        "kilim rug",
        "Turkish kilim",
        "flatweave kilim",
    ],
    "Seramik Tabak": [
        "ceramic plate",
        "decorative ceramic plate",
        "painted pottery plate",
    ],
    "Vazo": [
        "ceramic vase",
        "decorative vase",
        "pottery vase",
    ],
}


def api_json(params: dict) -> dict:
    url = "https://commons.wikimedia.org/w/api.php?" + urlencode(params)
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def search_images(query: str, limit: int) -> list[dict]:
    data = api_json(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": "6",
            "gsrsearch": f"{query} filetype:bitmap",
            "gsrlimit": str(limit),
            "prop": "imageinfo",
            "iiprop": "url|mime|extmetadata",
            "iiurlwidth": "640",
        }
    )

    pages = data.get("query", {}).get("pages", {})
    results = []
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        mime = info.get("mime", "")
        url = info.get("thumburl") or info.get("url", "")
        if mime not in {"image/jpeg", "image/png", "image/webp"}:
            continue
        if not url:
            continue
        results.append(
            {
                "title": page.get("title", "image"),
                "url": url,
                "mime": mime,
            }
        )
    return results


def download_file(url: str, target: Path) -> bool:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=45) as response:
            content = response.read()
        if len(content) < 8_000:
            return False
        target.write_bytes(content)
        return True
    except Exception as exc:
        print(f"indirilemedi: {exc}")
        return False


def extension_for(mime: str) -> str:
    if mime == "image/png":
        return ".png"
    if mime == "image/webp":
        return ".webp"
    return ".jpg"


def main() -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    for class_name, queries in QUERIES.items():
        class_dir = DATA_DIR / class_name
        class_dir.mkdir(parents=True, exist_ok=True)
        downloaded = 0
        seen_urls = set()

        for query in queries:
            for item in search_images(query, limit=25):
                if item["url"] in seen_urls:
                    continue
                seen_urls.add(item["url"])

                downloaded += 1
                target = class_dir / (
                    f"web_{downloaded:03d}{extension_for(item['mime'])}"
                )

                if target.exists():
                    continue

                if download_file(item["url"], target):
                    print(f"{class_name}: {target.name}")
                else:
                    downloaded -= 1

                if downloaded >= 18:
                    break
                time.sleep(1.2)

            if downloaded >= 18:
                break

        print(f"{class_name}: {downloaded} web gorsel indirildi")


if __name__ == "__main__":
    main()
