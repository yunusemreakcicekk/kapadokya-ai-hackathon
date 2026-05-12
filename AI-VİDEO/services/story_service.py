import os
import random
import re
import uuid
import urllib.parse
import requests
from google import genai


SPEECH_RATES = {
    "turkish": {"words": 2.05, "chars": 15},
    "english": {"words": 2.25, "chars": 15},
    "german": {"words": 1.85, "chars": 14},
    "spanish": {"words": 2.15, "chars": 15},
    "french": {"words": 2.05, "chars": 14},
    "arabic": {"words": 1.9, "chars": 12},
}

PRODUCTS = {"halı", "kilim", "çömlek", "vazo", "seramik", "tabak"}

PRODUCT_NAMES = {
    "turkish": {
        "halı": "halı",
        "kilim": "kilim",
        "çömlek": "çömlek",
        "vazo": "vazo",
        "seramik": "seramik",
        "tabak": "tabak",
    },
    "english": {
        "halı": "rug",
        "kilim": "kilim",
        "çömlek": "clay pot",
        "vazo": "vase",
        "seramik": "ceramic piece",
        "tabak": "plate",
    },
    "german": {
        "halı": "Teppich",
        "kilim": "Kilim",
        "çömlek": "Tongefäß",
        "vazo": "Vase",
        "seramik": "Keramikstück",
        "tabak": "Teller",
    },
    "spanish": {
        "halı": "alfombra",
        "kilim": "kilim",
        "çömlek": "vasija de barro",
        "vazo": "jarrón",
        "seramik": "pieza de cerámica",
        "tabak": "plato",
    },
    "french": {
        "halı": "tapis",
        "kilim": "kilim",
        "çömlek": "pot en argile",
        "vazo": "vase",
        "seramik": "pièce en céramique",
        "tabak": "assiette",
    },
    "arabic": {
        "halı": "سجادة",
        "kilim": "كليم",
        "çömlek": "إناء فخاري",
        "vazo": "مزهرية",
        "seramik": "قطعة خزفية",
        "tabak": "طبق",
    },
}

PRODUCT_CONTEXTS = {
    "halı": "woven craft, pattern, home warmth, lasting memory",
    "kilim": "traditional weaving, motifs, handmade cultural value",
    "çömlek": "earth, wheel-shaping, firing, artisan skill",
    "vazo": "elegant form, decorative value, thoughtful gift feeling",
    "seramik": "special clay, handcraft, kiln warmth, meaningful keepsake",
    "tabak": "table setting, sharing, handmade warmth, everyday elegance",
}

STORY_ANGLES = {
    "halı": [
        "focus on the pattern slowly finding its place in a warm home",
        "focus on the hands and patience behind the woven texture",
        "focus on the gift becoming part of daily home life",
    ],
    "kilim": [
        "focus on traditional motifs and cultural memory",
        "focus on the journey of a handmade textile from maker to owner",
        "focus on texture, color, and the warmth of a lived-in space",
    ],
    "çömlek": [
        "focus on earth turning into form under the artisan's hands",
        "focus on the wheel, clay, fire, and the final handmade gift",
        "focus on the object carrying the maker's patience",
    ],
    "vazo": [
        "focus on graceful form and the feeling of a thoughtful gift",
        "focus on how the vase will add presence to a room",
        "focus on the careful shaping of clay into an elegant keepsake",
    ],
    "seramik": [
        "focus on special clay, kiln warmth, and handcraft",
        "focus on the piece as a small keepsake with emotional value",
        "focus on the maker's touch and the journey to its new owner",
    ],
    "tabak": [
        "focus on handmade warmth reaching the table",
        "focus on sharing, daily rituals, and careful craft",
        "focus on a plate becoming part of meaningful meals",
    ],
}


def _language_key(language: str) -> str:
    key = (language or "").strip().lower()
    return key if key in SPEECH_RATES else "english"


def _normalize_product(product_type: str) -> str:
    value = (product_type or "").strip().lower()
    aliases = {"hali": "halı", "comlek": "çömlek", "çomlek": "çömlek"}
    value = aliases.get(value, value)
    return value if value in PRODUCTS else "seramik"


def _product_name(product_type: str, language: str) -> str:
    lang = _language_key(language)
    product = _normalize_product(product_type)
    return PRODUCT_NAMES.get(lang, PRODUCT_NAMES["english"]).get(product, product)


def _limits_for_duration(target_duration: float, language: str, max_words: int = 0, max_chars: int = 0):
    if max_words and max_chars:
        return max_words, max_chars

    if not target_duration or target_duration <= 0:
        return max_words or 70, max_chars or 500

    rates = SPEECH_RATES.get(_language_key(language), SPEECH_RATES["english"])
    safe_seconds = max(1, target_duration)

    return (
        max_words or max(8, min(160, int(safe_seconds * rates["words"]))),
        max_chars or max(50, min(1200, int(safe_seconds * rates["chars"]))),
    )


def _target_word_floor(max_words: int) -> int:
    return max(8, int(max_words * 0.72)) if max_words else 0


def _fit_to_limits(text: str, max_words: int, max_chars: int) -> str:
    cleaned = " ".join((text or "").split()).strip()
    if not cleaned:
        return cleaned

    if max_words > 0:
        words = cleaned.split()
        if len(words) > max_words:
            cleaned = " ".join(words[:max_words])

    if max_chars > 0 and len(cleaned) > max_chars:
        clipped = cleaned[:max_chars].rsplit(" ", 1)[0].strip()
        cleaned = clipped or cleaned[:max_chars].strip()

    return cleaned.rstrip(".,;:،") + "."


def _pretty_name(value: str) -> str:
    return " ".join(part.strip(" .,:;").capitalize() for part in value.split() if part.strip(" .,:;"))


def _normalize_known_place(value: str) -> str:
    lowered = value.lower()
    if lowered in {"nevşehir", "nevsehir", "nevþehir"}:
        return "Nevşehir"
    return value


def _clean_recipient(raw: str) -> str:
    value = raw.replace("'", "").strip(" .,:;")
    lower = value.lower()
    if lower.endswith(("ya", "ye")) and len(value) > 3:
        value = value[:-2]
    elif lower.endswith(("a", "e")) and len(value) > 3:
        value = value[:-1]
    return _pretty_name(value)


def _extract_turkish_details(user_prompt: str, product_type: str = "seramik") -> dict:
    detail = " ".join((user_prompt or "").split()).strip()
    lower = detail.lower()
    product = _normalize_product(product_type)

    maker = ""
    recipient = ""
    place = ""
    material = ""

    maker_match = re.search(r"(.+?)\s+(?:yaptı|yapti|tarafından|tarafindan)", lower)
    if maker_match:
        maker = _pretty_name(maker_match.group(1))

    place_match = re.search(r"yap(?:ı|i)l(?:ı|i)ş\s*yeri\s+([a-zçğıöşü\s]+)", lower)
    if place_match:
        raw_place = place_match.group(1)
        raw_place = re.split(r"\b(?:özel|ozel|kil|vazo|kupa|tabak|çömlek|comlek|seramik|halı|hali|kilim)\b", raw_place)[0]
        place = _normalize_known_place(_pretty_name(raw_place))

    recipient_match = re.search(r"([a-zçğıöşü']+)\s+hediye", lower)
    if recipient_match:
        recipient = _clean_recipient(recipient_match.group(1))

    if "özel kil" in lower or "ozel kil" in lower:
        material = "özel kil"
    elif "kil" in lower:
        material = "kil"

    # Only infer product from keywords when no explicit product selection was made.
    if product_type in ("", "seramik"):
        for candidate in ("vazo", "kupa", "tabak", "çömlek", "comlek", "bardak", "seramik", "halı", "hali", "kilim"):
            if candidate in lower:
                product = _normalize_product(candidate)
                break

    return {
        "detail": detail,
        "maker": maker,
        "recipient": recipient,
        "place": place,
        "material": material,
        "product": product,
    }


def _material_phrase_tr(material: str) -> str:
    if material == "özel kil":
        return "özel kilden"
    if material == "kil":
        return "kilden"
    return "özenle"


def _material_for_product(material: str, product: str) -> str:
    if product in {"halı", "kilim"}:
        return ""
    return material


def _turkish_possessive(name: str) -> str:
    clean = name.strip()
    if not clean:
        return clean
    vowels = "aıoueiöü"
    last_vowel = next((ch for ch in reversed(clean.lower()) if ch in vowels), "a")
    suffix = "ın"
    if last_vowel in "ei":
        suffix = "in"
    elif last_vowel in "ou":
        suffix = "un"
    elif last_vowel in "öü":
        suffix = "ün"
    if clean[-1].lower() in vowels:
        suffix = "n" + suffix
    return f"{clean}'{suffix}"


def _localized_parts(details: dict, language: str, product_type: str):
    lang = _language_key(language)
    normalized_product = details["product"] or _normalize_product(product_type)
    product = _product_name(normalized_product, language)
    maker = details["maker"]
    recipient = details["recipient"]
    place = details["place"]
    material = _material_for_product(details["material"], normalized_product)

    material_phrase = {
        "english": "with special clay" if material else "with care",
        "german": "aus besonderem Ton" if material else "mit Sorgfalt",
        "spanish": "con arcilla especial" if material else "con cuidado",
        "french": "avec une argile spéciale" if material else "avec soin",
        "arabic": "من طين خاص" if material else "بعناية",
    }.get(lang, "with care")

    return product, maker, recipient, place, material_phrase


def _variant_index(variant: int | None, count: int) -> int:
    if count <= 0:
        return 0
    if variant is None:
        return random.randrange(count)
    return variant % count


def _build_turkish_story(details: dict, max_words: int, max_chars: int, variant: int | None = None) -> str:
    maker = details["maker"]
    recipient = details["recipient"]
    place = details["place"]
    product = details["product"]
    material = _material_for_product(details["material"], product)
    material_phrase = _material_phrase_tr(material)

    templates = []
    if maker and recipient and place:
        templates = [
            f"{place}'de {maker} tarafından {material_phrase} hazırlanan bu {product}, {recipient} için düşünülmüş anlamlı bir hediye.",
            f"{_turkish_possessive(maker)} {place}'de {material_phrase} şekillendirdiği bu {product}, {recipient}'a özel bir hatıra olarak hazırlandı.",
            f"{place}'in emeğini taşıyan bu {product}, {_turkish_possessive(maker)} ellerinden çıkıp {recipient} için özel bir hediyeye dönüştü.",
        ]
    elif maker and recipient:
        templates = [
            f"{maker} tarafından {material_phrase} hazırlanan bu {product}, {recipient} için anlamlı bir hediye.",
            f"{_turkish_possessive(maker)} emeğiyle ortaya çıkan bu {product}, {recipient}'a özel bir hatıra olarak hazırlandı.",
        ]
    elif recipient and place:
        templates = [
            f"{place}'de {material_phrase} hazırlanan bu {product}, {recipient} için anlamlı bir hediye.",
            f"{recipient} için seçilen bu {product}, {place}'deki el emeğinin sıcaklığını taşıyor.",
        ]
    elif maker:
        templates = [
            f"{maker} tarafından {material_phrase} hazırlanan bu {product}, el emeğiyle değer kazandı.",
            f"{_turkish_possessive(maker)} dokunuşuyla şekillenen bu {product}, özel bir hatıra olarak yola çıkıyor.",
        ]
    else:
        templates = [
            f"Bu özel {product}, el emeğiyle hazırlanmış anlamlı bir hatıra.",
            f"Özenle hazırlanan bu {product}, yeni sahibine sıcak ve kişisel bir hikaye taşıyor.",
        ]

    story = templates[_variant_index(variant, len(templates))]
    return _expand_story(story, "turkish", product, max_words, max_chars, variant)


def _build_localized_story(user_prompt: str, language: str, max_words: int, max_chars: int, product_type: str, variant: int | None = None) -> str:
    lang = _language_key(language)
    details = _extract_turkish_details(user_prompt, product_type)
    if lang == "turkish":
        return _build_turkish_story(details, max_words, max_chars, variant)

    product, maker, recipient, place, material_phrase = _localized_parts(details, language, product_type)
    by = {
        "english": f"by {maker}" if maker else "by careful hands",
        "german": f"von {maker}" if maker else "mit viel Sorgfalt",
        "spanish": f"por {maker}" if maker else "con mucho cuidado",
        "french": f"par {maker}" if maker else "avec beaucoup de soin",
        "arabic": f"على يد {maker}" if maker else "بعناية كبيرة",
    }[lang]
    at = {
        "english": f"in {place} " if place else "",
        "german": f"in {place} " if place else "",
        "spanish": f"en {place} " if place else "",
        "french": f"à {place} " if place else "",
        "arabic": f"في {place} " if place else "",
    }[lang]

    templates_by_lang = {
        "english": [
            f"This {product} was prepared {at}{by} {material_phrase}, as a meaningful gift for {recipient or 'someone special'}.",
            f"Shaped {at}{by}, this {product} carries the warmth of a thoughtful handmade gift for {recipient or 'its new owner'}.",
            f"From {place or 'the workshop'} to {recipient or 'its new home'}, this {product} carries care, patience, and a personal story.",
        ],
        "german": [
            f"Dieses {product} wurde {at}{by} {material_phrase} gefertigt, als besonderes Geschenk für {recipient or 'einen lieben Menschen'}.",
            f"{at.capitalize()}{by} entstanden, trägt dieses {product} die Wärme echter Handarbeit.",
            f"Dieses {product} verbindet sorgfältige Arbeit mit einer persönlichen Geschichte für {recipient or 'seinen neuen Besitzer'}.",
        ],
        "spanish": [
            f"Este {product} fue elaborado {at}{by} {material_phrase}, como un regalo significativo para {recipient or 'alguien especial'}.",
            f"Nacido {at}{by}, este {product} lleva la calidez de una pieza hecha a mano.",
            f"De {place or 'el taller'} a {recipient or 'su nuevo hogar'}, este {product} cuenta una historia hecha con cuidado.",
        ],
        "french": [
            f"Ce {product} a été réalisé {at}{by} {material_phrase}, comme un cadeau plein de sens pour {recipient or 'une personne spéciale'}.",
            f"Né {at}{by}, ce {product} porte la chaleur d'un travail fait main.",
            f"De {place or 'l’atelier'} à {recipient or 'son nouveau foyer'}, ce {product} raconte une histoire façonnée avec soin.",
        ],
        "arabic": [
            f"تم صنع هذه {product} {at}{by} {material_phrase}، كهدية ذات معنى لـ {recipient or 'شخص مميز'}.",
            f"تحمل هذه {product} دفء العمل اليدوي وقصة صُنعت بعناية لـ {recipient or 'صاحبها الجديد'}.",
            f"من {place or 'الورشة'} إلى {recipient or 'بيتها الجديد'}، تصل هذه {product} محملة بالعناية والاهتمام.",
        ],
    }
    templates = templates_by_lang[lang]
    story = templates[_variant_index(variant, len(templates))]
    return _expand_story(story.replace("  ", " ").replace(" ,", ","), lang, product, max_words, max_chars, variant)


def _expand_story(text: str, language: str, product: str, max_words: int, max_chars: int, variant: int | None = None) -> str:
    additions_by_lang = {
        "turkish": [
            "Her detayı el emeğinin sıcaklığını taşıyor.",
            "Bu parça, sadece bir ürün değil; saklanacak özel bir hatıra.",
            "Yeni yerinde her bakışta bu emeği hatırlatacak.",
        ],
        "english": [
            f"Every detail helps this {product} feel like a keepsake, not just an object.",
            "It is made to carry a small story into everyday life.",
            "Its quiet details make the gift feel personal and lasting.",
        ],
        "german": [
            f"Jedes Detail macht dieses {product} zu einer bleibenden Erinnerung.",
            "So wird aus einem Gegenstand ein sehr persönliches Geschenk.",
        ],
        "spanish": [
            f"Cada detalle convierte este {product} en un recuerdo para conservar.",
            "No es solo una pieza; es un gesto pensado con cariño.",
        ],
        "french": [
            f"Chaque détail fait de ce {product} un souvenir à garder.",
            "Ce n’est pas seulement un objet, mais une attention personnelle.",
        ],
        "arabic": [
            f"كل تفصيل يجعل هذه {product} ذكرى تستحق الاحتفاظ بها.",
            "إنها ليست مجرد قطعة، بل هدية تحمل إحساسًا شخصيًا.",
        ],
    }
    additions = additions_by_lang.get(language, additions_by_lang["english"])
    start = _variant_index(variant, len(additions))
    ordered = additions[start:] + additions[:start]

    story = text
    for addition in ordered:
        if len(story.split()) >= _target_word_floor(max_words):
            break
        candidate = f"{story} {addition}"
        if max_words and len(candidate.split()) > max_words:
            continue
        if max_chars and len(candidate) > max_chars:
            continue
        story = candidate
    return _fit_to_limits(story, max_words, max_chars)


def _fallback_story(
    seller_name: str,
    country: str,
    language: str,
    user_prompt: str = "",
    current_story: str = "",
    target_duration: float = 0,
    max_words: int = 0,
    max_chars: int = 0,
    product_type: str = "seramik",
    variant: int | None = None,
) -> str:
    word_limit, char_limit = _limits_for_duration(target_duration, language, max_words, max_chars)
    lang = _language_key(language)
    product = _product_name(product_type, language)

    if user_prompt.strip():
        return _build_localized_story(user_prompt, language, word_limit, char_limit, product_type, variant)

    starter_by_lang = {
        "turkish": f"{seller_name} atölyesinde hazırlanan bu özel {_normalize_product(product_type)}, {country} yolculuğuna çıkıyor.",
        "english": f"This handmade {product} from {seller_name} is now on its way to {country}.",
        "german": f"Dieses handgemachte {product} von {seller_name} ist nun auf dem Weg nach {country}.",
        "spanish": f"Este {product} hecho a mano por {seller_name} va camino a {country}.",
        "french": f"Ce {product} fait main par {seller_name} part maintenant vers {country}.",
        "arabic": f"هذه {product} المصنوعة يدويًا من {seller_name} في طريقها الآن إلى {country}.",
    }
    return _expand_story(starter_by_lang[lang], lang, product, word_limit, char_limit, variant)


def _should_replace_with_localized(text: str, user_prompt: str, language: str) -> bool:
    detail = " ".join((user_prompt or "").split()).strip()
    if not detail:
        return False
    important_terms = [
        term
        for term in detail.lower().replace(".", " ").replace(",", " ").split()
        if len(term) >= 5
    ]
    return not all(term in text.lower() for term in important_terms)


def translate_story(
    text: str,
    language: str,
    target_duration: float = 0,
    max_words: int = 0,
    max_chars: int = 0,
    product_type: str = "seramik",
) -> str:
    """
    Translate a Turkish manual voiceover into the selected target language.
    """
    source_text = " ".join((text or "").split()).strip()
    if not source_text:
        return ""

    product_type = _normalize_product(product_type)
    lang = _language_key(language)
    word_limit, char_limit = _limits_for_duration(target_duration, language, max_words, max_chars)

    if lang == "turkish":
        return _fit_to_limits(source_text, word_limit, char_limit)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY bulunamadi!")

    product_name = _product_name(product_type, language)
    duration_rule = (
        "Keep it concise and natural for a short social media voiceover."
        if not target_duration
        else (
            f"The video is about {round(target_duration)} seconds long. "
            f"Use between {max(1, int(word_limit * 0.72))} and {word_limit} words, "
            f"and never exceed {char_limit} characters."
        )
    )

    prompt = f"""
You are a professional advertising voiceover translator.
Translate and lightly adapt this Turkish manual voiceover into the target language.

Target language: {language}
Selected product type: {product_name}
Duration rule: {duration_rule}

Rules:
1. Write ONLY in {language}.
2. Preserve names, places, makers, recipients, product details, and material details.
3. Do not add facts that are not in the Turkish source.
4. Make it sound fluent, natural, and suitable for voiceover.
5. Return only the translated voiceover text.

Turkish source:
"{source_text}"
"""

    try:
        config = None
        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                temperature=0.35,
                top_p=0.9,
            )
        except Exception:
            config = None

        if config:
            response = genai.Client(api_key=api_key).models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=config,
            )
        else:
            response = genai.Client(api_key=api_key).models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )

        translated = (response.text or "").strip().strip('"')
        if not translated:
            raise ValueError("Bos ceviri cevabi alindi.")

        return _fit_to_limits(translated, word_limit, char_limit)
    except Exception as e:
        print(f"Gemini Ceviri Hatasi: {e}")
        # Gemini failed (e.g. rate limit), fallback to a literal translation using Google Translate free API
        try:
            gt_langs = {
                "english": "en",
                "german": "de",
                "spanish": "es",
                "french": "fr",
                "arabic": "ar"
            }
            target_lang_code = gt_langs.get(lang, "en")
            
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl={target_lang_code}&dt=t&q={urllib.parse.quote(source_text)}"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                translated_text = "".join([sentence[0] for sentence in data[0] if sentence[0]])
                return _fit_to_limits(translated_text, word_limit, char_limit)
            else:
                raise Exception(f"Google Translate API Error: {resp.status_code}")
        except Exception as gt_e:
            print(f"Fallback Çeviri Hatası: {gt_e}")
            raise ValueError("Çeviri servisi şu anda çalışmıyor (Kota dolmuş olabilir). Lütfen metni kendiniz çevirerek giriniz.")

def generate_story(
    seller_name: str,
    country: str,
    language: str,
    user_prompt: str = "",
    current_story: str = "",
    target_duration: float = 0,
    max_words: int = 0,
    max_chars: int = 0,
    product_type: str = "seramik",
) -> str:
    """
    Generate or revise a varied voiceover story that fits the target video duration.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY bulunamadı!")

    product_type = _normalize_product(product_type)
    lang = _language_key(language)
    word_limit, char_limit = _limits_for_duration(target_duration, language, max_words, max_chars)
    product_name = _product_name(product_type, language)
    product_context = PRODUCT_CONTEXTS[product_type]
    angle = random.choice(STORY_ANGLES[product_type])
    variant = random.randint(0, 10_000)
    nonce = uuid.uuid4().hex[:8]

    duration_rule = (
        "Keep the voiceover concise and natural for a short social media video."
        if not target_duration
        else (
            f"The video is about {round(target_duration)} seconds long. "
            f"Use between {max(1, int(word_limit * 0.72))} and {word_limit} words, "
            f"and never exceed {char_limit} characters. Fill most of the video without running over."
        )
    )

    base_prompt = f"""
You are an expert advertising voiceover writer. Create a fresh, varied voiceover in the target language.

Seller / context: {seller_name}
Selected product type: {product_name}
Product-specific angle: {product_context}
Story angle for this generation: {angle}
Audience / destination country: {country}
Target language: {language}
Duration rule: {duration_rule}
Variation token: {nonce}

Important:
- Write ONLY in {language}. Do not use English unless the target language is English.
- Do not reuse a generic template. Make this generation sound different from previous attempts.
- Preserve names, places, maker/artisan names, product type, and material details from the user's keywords.
- Infer relationships between details; do not list raw keywords.
"""

    if current_story.strip():
        base_prompt += f"""
Existing story text:
"{current_story.strip()}"

User revision request or keywords:
"{user_prompt.strip()}"

Rewrite the existing story with a new wording and the selected product type.
"""
    elif user_prompt.strip():
        base_prompt += f"""
User keywords:
"{user_prompt.strip()}"

Turn these keywords into fluent, emotional, grammatically correct voiceover copy.
"""
    else:
        base_prompt += f"""
Write a product-specific voiceover for this handmade {product_name}. Mention the product naturally and use the story angle above.
"""

    base_prompt += f"""
Rules:
1. Return only the voiceover text.
2. Use between {max(1, int(word_limit * 0.72))} and {word_limit} words.
3. Stay under {char_limit} characters.
4. Do not write broken or unfinished sentences.
5. Make the wording product-specific and not identical to common fallback lines.
"""

    try:
        config = None
        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                temperature=0.95,
                top_p=0.95,
            )
        except Exception:
            config = None

        if config:
            response = genai.Client(api_key=api_key).models.generate_content(
                model="gemini-2.0-flash",
                contents=base_prompt,
                config=config,
            )
        else:
            response = genai.Client(api_key=api_key).models.generate_content(
                model="gemini-2.0-flash",
                contents=base_prompt,
            )

        story = response.text.strip()
        if _should_replace_with_localized(story, user_prompt, language):
            story = _build_localized_story(user_prompt, language, word_limit, char_limit, product_type, variant)
        else:
            story = _expand_story(story, lang, product_name, word_limit, char_limit, variant)
        return _fit_to_limits(story, word_limit, char_limit)
    except Exception as e:
        print(f"Gemini API Hatasi: {e}")
        print("Gemini cevap veremediği için varyasyonlu yedek metin kullanılıyor.")
        return _fallback_story(
            seller_name,
            country,
            language,
            user_prompt,
            current_story,
            target_duration,
            word_limit,
            char_limit,
            product_type,
            variant,
        )
