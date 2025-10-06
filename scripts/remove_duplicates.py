import json

def unique(json_content: str) -> dict:
    content = json.loads(json_content)

    seen_identifiers = set()
    unique_features = []
    duplicate_count = 0
    wrong_type_count = 0
    
    for feature in content['features']:
        # if not feature['properties']['gid'] in seen_identifiers:
        #     seen_identifiers.add(feature['properties']['gid'])
        #     unique_features.append(feature)
        # else:
        #     duplicate_count += 1
        #     print(f"Duplicate feature with gid {feature['properties']['gid']} found and removed.")
            
        if not feature['properties']['localtype'] == 'Natura2000':
            wrong_type_count += 1
            print(f"Non Natura2000 feature {feature['properties']['localtype']} found and removed")
        else:
            unique_features.append(feature)
            
        
    initial_count = len(content['features'])
    removed =  duplicate_count + wrong_type_count
    print(f"Removed: {duplicate_count} duplicates")
    print(f"Removed: {wrong_type_count} wrong type")
    print(f"Total removed: {removed}")
    print(f"Remaining features: {initial_count - removed}")
    
    del content['numberReturned']
    content['total'] = initial_count - removed
    content['features'] = unique_features
    return content

json_url = "public/data/nfz/pdok/luchtvaartgebieden-zonder-natura-2000.geojson"
with open(json_url, "r", encoding="utf-8") as f:
    json_content = f.read()
    filtered = unique(json_content)
    with open("public/data/nfz/pdok/luchtvaartgebieden-zonder-natura-2000-cleaned.geojson", "w", encoding="utf-8") as out:
        json.dump(filtered, out, indent=2)