import re

with open('frontend/src/i18n/translations.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# find keys like "en": {, "hi": {
sections = re.findall(r'"([a-z]{2,5})":\s*\{', text)
print("Sections found:", sections)

# check how many keys in 'en'
en_block = text[text.find('"en":'):text.find('"hi":')]
en_keys = re.findall(r'"([a-zA-Z0-9_-]+)":\s*"', en_block)
print(f"en has {len(en_keys)} keys")

for lang in ["hi", "ta", "kn", "te", "bn"]:
    pos = text.find(f'"{lang}":')
    if pos != -1:
        # count keys roughly
        snippet = text[pos:pos+4000]
        l_keys = re.findall(r'"([a-zA-Z0-9_-]+)":\s*"', snippet)
        print(f"{lang} has ~{len(l_keys)} keys found in first 4000 chars")
    else:
        print(f"{lang} NOT FOUND in translations.ts!")
