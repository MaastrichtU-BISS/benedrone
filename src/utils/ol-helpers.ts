import Map from 'ol/Map'
import View from 'ol/View'
import * as Source from 'ol/source'
import * as Layer from 'ol/layer'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Stroke, Fill, Circle } from 'ol/style'
import Overlay from 'ol/Overlay'
import type { Coordinate } from 'ol/coordinate'
import { fromLonLat } from 'ol/proj'
import { getCenter } from 'ol/extent'
import { Feature } from 'ol'
import { Geometry, LineString, Point, Polygon } from 'ol/geom'

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

  return map
}

export function addNoFlyZones(map: Map, nfzList: string[]): void {
  nfzList.forEach((nfz) => {
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
            fill: new Fill({ color: 'rgba(255,0,0,0.3)' }),
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
}

export function addNfzOverlay(map: Map, elementId: string): void {
  const popupElement = document.getElementById(elementId)

  if (!popupElement) {
    throw new Error('Overlay Popup not found')
  }

  const popup = new Overlay({
    element: popupElement,
    positioning: 'bottom-center',
    stopEvent: true,
    offset: [0, -10],
  })

  map.addOverlay(popup)

  map.on('singleclick', (evt) => {
    popupElement.replaceChildren()

    let clickedFeature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature)

    if (clickedFeature instanceof Feature) {
      const geometry = clickedFeature?.getGeometry()

      let coords = undefined
      if (geometry instanceof Point) {
        coords = geometry.getCoordinates() as Coordinate
      } else if (geometry instanceof Polygon || geometry instanceof LineString) {
        coords = getCenter(geometry.getExtent())
      }

      const props = clickedFeature.getProperties()

      const nameEle = document.createElement('b')
      nameEle.innerText = props.txtname ?? props.source_txt ?? 'No name'

      popupElement.appendChild(nameEle)

      const localType = props.localtype
      if (localType) {
        const localTypeEle = document.createElement('div')
        localTypeEle.innerText = localType
        popupElement.appendChild(localTypeEle)
      }

      const specific = props.specifiek
      if (specific) {
        const specificEle = document.createElement('div')
        specificEle.innerText = specific
        popupElement.appendChild(specificEle)
      }

      popup.setPosition(coords)
    } else {
      popup.setPosition(undefined) // hide popup if clicked outside
    }
  })
}
