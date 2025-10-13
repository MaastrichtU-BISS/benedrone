import Map from 'ol/Map'
import View from 'ol/View'
import * as Source from 'ol/source'
import * as Layer from 'ol/layer'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Stroke, Fill, Circle } from 'ol/style'
import Overlay from 'ol/Overlay'
import type { Coordinate } from 'ol/coordinate'
import { fromLonLat } from 'ol/proj'
import { Feature } from 'ol'
import type { NFZDataset } from '@/types'
import LayerSwitcher from 'ol-layerswitcher'
import type { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher'
import Geocoder from 'ol-geocoder/dist/ol-geocoder'

export function createMap(
  target: string = 'map',
  center: Coordinate = [0, 0],
  zoom: number = 2,
): Map {
  // focus the map view on the center
  const view = new View({
    center,
    zoom,
  })

  // use OpenStreetMap as the map source
  const mapLayer = new Layer.Tile({
    source: new Source.OSM(),
  })

  // create the map
  const map = new Map({
    target,
    layers: [mapLayer],
    view,
  })

  return map
}

//#region Controls
export function addControlLayerSwitcher(map: Map): void {
  const layerSwitcher = new LayerSwitcher({
    reverse: false,
    activationMode: 'click',
    groupSelectStyle: 'children',
    startActive: true,
  })

  map.addControl(layerSwitcher)
}

export function addControlGeocoder(map: Map): void {
  const geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'en-US',
    placeholder: 'Search for ...',
    targetType: 'glass-button',
    limit: 5,
    keepOpen: true,
    preventMarker: false,
  })

  geocoder.on('addresschosen', (evt: any) => {
    const feature = evt.feature,
      // coord = evt.coordinate,
      address = evt.address
    feature.setProperties({ name: address.original.formatted })
    // action to be taken
  })

  map.addControl(geocoder)
}
//#endregion

export function addNoFlyZones(map: Map, datasets: NFZDataset[]): void {
  datasets.forEach((dataset) => {
    dataset.countries.forEach((country) => {
      let layers: BaseLayerOptions[] = []
      country.files.forEach((nfz) => {
        const noFlyZonesVector = new Source.Vector({
          url: `data/nfz/${nfz.url}.${dataset.format}`,
          format: new GeoJSON({
            dataProjection: 'EPSG:4326', // most GeoJSON is lon/lat
            featureProjection: 'EPSG:3857', // map projection
          }),
        })

        const noFlyZonesLayer = new Layer.Vector({
          source: noFlyZonesVector,
          style: (feature: Feature) => {
            const geomType = feature?.getGeometry()?.getType()
            if (geomType === 'Point') {
              return new Style({
                image: new Circle({
                  radius: 6,
                  fill: new Fill({ color: nfz.fillColor }),
                  stroke: new Stroke({ color: nfz.borderColor, width: 2 }),
                }),
              })
            } else {
              return new Style({
                fill: new Fill({ color: nfz.fillColor }),
                stroke: new Stroke({
                  color: nfz.borderColor,
                  width: 1,
                }),
              })
            }
          },
        } as BaseLayerOptions)

        noFlyZonesLayer.set(
          'title',
          `<span class="swatch" style="background-color: ${nfz.fillColor}; border-color: ${nfz.borderColor}"></span>${nfz.title}`,
        )
        noFlyZonesLayer.set('visible', nfz.visible)
        noFlyZonesLayer.set('type', 'overlay')

        layers.push(noFlyZonesLayer as BaseLayerOptions)
      })

      const groupLayer = new Layer.Group({
        title: `${dataset.title} (${country.code}) <a class="dataset-link" href="${country.url || dataset.url}" target="_blank" rel="noopener noreferrer"></a>`,
        layers,
      } as GroupLayerOptions)

      map.addLayer(groupLayer)
    })
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
      let coords = evt.coordinate

      const props = clickedFeature.getProperties()

      const nameEle = document.createElement('b')
      nameEle.innerText = props.name || props.txtname || props.source_txt || 'No name'

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
