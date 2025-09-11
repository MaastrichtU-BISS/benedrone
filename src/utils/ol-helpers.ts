import Map from 'ol/Map'
import View from 'ol/View'
import * as Source from 'ol/source'
import * as Layer from 'ol/layer'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Stroke, Fill, Circle } from 'ol/style'
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
  const mapSource = new Source.OSM()
  const mapLayer = new Layer.Tile({ source: mapSource })

  // create the map
  const map = new Map({
    target,
    layers: [mapLayer],
    view,
  })

  // taken from https://www.openaip.net/data/exports?page=1&limit=50&sortBy=country&sortDesc=true&failed=false&country=NL&format=geojson
  const noFlyZones = [
    'nl_apt',
    // 'nl_asp',
    'nl_hot',
    'nl_nav',
    'nl_obs',
    'nl_raa',
    'nl_rca',
    'nl_rpp',
  ]

  noFlyZones.forEach((nfz) => {
    const noFlyZonesVector = new Source.Vector({
      url: `data/nfz/${nfz}.geojson`,
      format: new GeoJSON({
        dataProjection: 'EPSG:4326', // most GeoJSON is lon/lat
        featureProjection: 'EPSG:3857', // map projection
      }),
    })

    const noFlyZonesLayer = new Layer.Vector({
      source: noFlyZonesVector,
      style: (feature) => {
        const geomType = feature?.getGeometry()?.getType()
        if (geomType === 'Point') {
          return new Style({
            image: new Circle({
              radius: 6,
              fill: new Fill({ color: 'rgba(255,0,0,0.8)' }),
              stroke: new Stroke({ color: '#ff0000', width: 2 }),
            }),
          })
        } else {
          return new Style({
            stroke: new Stroke({
              color: '#ff0000',
              width: 1,
            }),
          })
        }
      },
    })

    // add no fly zones layers
    map.addLayer(noFlyZonesLayer)
  })

  return map
}
