import Map from 'ol/Map'
import View from 'ol/View'
import OSM from 'ol/source/OSM'
import TileLayer from 'ol/layer/Tile'
import type { Coordinate } from 'ol/coordinate'
import { fromLonLat } from 'ol/proj'

export function createMap(
  target: string = 'map',
  center: Coordinate = [0, 0],
  zoom: number = 2,
): Map {
  // the default projection is Spherical Mercator (EPSG:3857), with meters as map units.
  // so we need to transform the coordinates from longitude/latitude to map projection
  const view = new View({
    center: fromLonLat(center),
    zoom,
  })

  // use OpenStreetMap as the map source
  const source = new OSM()
  const layer = new TileLayer({ source })

  // create the map
  const map = new Map({
    target,
    layers: [layer],
    view,
  })

  return map
}
