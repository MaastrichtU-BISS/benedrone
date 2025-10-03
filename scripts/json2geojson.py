import json
from shapely.geometry import Point, mapping
json_url = "public/data/nfz/rijksoverheid/open-category.json"

def circle_to_polygon(lon, lat, radius, num_sides=64):
    """
    Convert a circle into a polygon approximation.
    - lon, lat: center coordinates
    - radius: in meters (assumes coordinates are EPSG:4326, will look like degrees if not projected)
    - num_sides: number of vertices in polygon
    """
    # Shapely buffer radius is in coordinate units (degrees if WGS84!)
    # If your radius is in meters, you need to project to a meter-based CRS first (e.g., EPSG:3857)
    # For simplicity, this assumes radius is in degrees OR very small area where distortion is acceptable.
    circle = Point(lon, lat).buffer(radius, resolution=num_sides)
    return mapping(circle)  # returns GeoJSON-like dict

def parse(json_content):
    content = json.loads(json_content)

    content['type'] = 'FeatureCollection' #add or replace type

    if not 'features' in content:
        return ValueError("Invalid GeoJSON: missing 'features' key or empty features list")

    features = content['features']

    for f in features:
        
        # move metadata to properties
        properties = {}

        if not 'identifier' in f:
            raise ValueError("Invalid GeoJSON: missing 'identifier' key in feature")
        
        properties['identifier'] = f['identifier']
        del f['identifier']

        if not 'country' in f:
            raise ValueError("Invalid GeoJSON: missing 'country' key in feature")
        
        properties['country'] = f['country']
        del f['country']

        if not 'name' in f:
            raise ValueError("Invalid GeoJSON: missing 'name' key in feature")
        
        properties['name'] = f['name']
        del f['name']

        if not 'type' in f:
            raise ValueError("Invalid GeoJSON: missing 'type' key in feature")
        
        properties['type'] = f['type']
        del f['type']

        if not 'restriction' in f:
            raise ValueError("Invalid GeoJSON: missing 'restriction' key in feature")
        
        properties['restriction'] = f['restriction']
        del f['restriction']

        if not 'reason' in f:
            raise ValueError("Invalid GeoJSON: missing 'reason' key in feature")
        
        properties['reason'] = f['reason']
        del f['reason']

        if not 'applicability' in f:
            raise ValueError("Invalid GeoJSON: missing 'applicability' key in feature")
        
        properties['applicability'] = f['applicability']
        del f['applicability']

        if not 'zoneAuthority' in f:
            raise ValueError("Invalid GeoJSON: missing 'zoneAuthority' key in feature")
        
        properties['zoneAuthority'] = f['zoneAuthority']
        del f['zoneAuthority']

        if not 'message' in f:
            raise ValueError("Invalid GeoJSON: missing 'message' key in geometry")
        
        properties['message'] = f['message']
        del f['message']

        if not 'geometry' in f:
            raise ValueError("Invalid GeoJSON: missing 'geometry' key in feature")
        
        if len(f['geometry']) > 1:
            print(f"Warning: feature {properties['identifier']} has multiple geometries, only the first one will be used")
        
        geometry = f['geometry'][0]

        if len(f['geometry']) > 1:
            print(f"Warning: feature {properties['identifier']} has multiple geometries, only the first one will be used")

        if not 'horizontalProjection' in geometry:
            raise ValueError("Invalid GeoJSON: missing 'horizontalProjection' key in geometry")
        
        horizontalProjection = geometry['horizontalProjection']

        if horizontalProjection['type'] == 'Circle':
            lon, lat = horizontalProjection['center']
            radius = horizontalProjection['radius']
            polygon = circle_to_polygon(lon, lat, radius)
            horizontalProjection = polygon

        f['type'] = 'Feature'
        f['geometry'] = horizontalProjection
        f['properties'] = properties

    return content

with open(json_url, "r", encoding="utf-8") as f:
    json_content = f.read()
    geojson = parse(json_content)
    with open("public/data/nfz/rijksoverheid/open-category.geojson", "w", encoding="utf-8") as out:
        json.dump(geojson, out, indent=2)