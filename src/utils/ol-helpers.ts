import Map from 'ol/Map'
import View from 'ol/View'
import * as Source from 'ol/source'
import * as Layer from 'ol/layer'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Stroke, Fill, Circle } from 'ol/style'
import Overlay from 'ol/Overlay'
import { getCenter, type Extent } from 'ol/extent'
import { Feature } from 'ol'
import type { NFZDataset } from '@/types'
import LayerSwitcher from 'ol-layerswitcher'
import type { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher'
import Geocoder from 'ol-geocoder/dist/ol-geocoder'
import type { Coordinate } from 'ol/coordinate'

export function createMap(extent: Extent, center: Coordinate | null = null): Map {
  // focus the map view on the center

  const view = new View({
    projection: 'EPSG:3857',
    extent,
    center: center || getCenter(extent),
    zoom: 8,
    minZoom: 8,
    maxZoom: 20,
  })

  // use OpenStreetMap as the map source
  const mapLayer = new Layer.Tile({
    source: new Source.OSM(),
  })

  // create the map
  const map = new Map({
    target: 'map',
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
      extractMetadata(popupElement, props)
      popup.setPosition(coords)
    } else {
      popup.setPosition(undefined) // hide popup if clicked outside
    }
  })
}

function extractMetadata(popupElement: HTMLElement, props: any) {

  const nameEle = document.createElement('b')
  nameEle.classList.add('title')
  nameEle.innerText = props.name || props.txtname || props.source_txt || 'No name'
  popupElement.appendChild(nameEle)

  const localType = props.localtype
  if (localType) {
    const localTypeEle = document.createElement('div')
    localTypeEle.innerText = localType
    popupElement.appendChild(localTypeEle)
  }

  const remarks = props.remarks
  if(remarks) {
    const remarksEle = document.createElement('div')
    remarksEle.innerText = remarks
    popupElement.appendChild(remarksEle)
  }

  const specific = props.specifiek
  if (specific) {
    const specificEle = document.createElement('div')
    specificEle.innerText = specific
    popupElement.appendChild(specificEle)
  }

  // OBS, NAV, APT, HOT
  const elevation = props.elevation
  if(elevation) {
    const elevationEle = document.createElement('div')
    elevationEle.innerHTML = `Elevation: ${elevation.value}${elevation.unit === 0 ? 'm' : ''}`
    popupElement.appendChild(elevationEle)
  }

  // OBS
  const height = props.height
  if(height) {
    const heightEle = document.createElement('div')
    heightEle.innerText = `Height: ${height.value}${height.unit === 0 ? 'm' : 'units'}`
    popupElement.appendChild(heightEle)
  }

  // RAA
  const permittedAltitude = props.permittedAltitude
  if(permittedAltitude) {
    const permittedAltitudeEle = document.createElement('div')
    permittedAltitudeEle.innerText = `Permitted Altitude: ${permittedAltitude.value}${permittedAltitude.unit === 0 ? 'm' : 'units'}`
    popupElement.appendChild(permittedAltitudeEle)
  }

  // APT
  const skydiveActivity = props.skydiveActivity
  if(skydiveActivity !== undefined) {
    const skydiveActivityEle = document.createElement('div')
    skydiveActivityEle.innerHTML = `Skydive activity: ${skydiveActivity}`
    popupElement.appendChild(skydiveActivityEle)
  }

  // APT
  const _private = props.private
  if(_private !== undefined) {
    const _privateEle = document.createElement('div')
    _privateEle.innerHTML = `Private: ${_private}`
    popupElement.appendChild(_privateEle)
  }

  // APT
  const winchOnly = props.winchOnly
  if(winchOnly !== undefined) {
    const winchOnlyEle = document.createElement('div')
    winchOnlyEle.innerText = `Winch only: ${winchOnly}`
    popupElement.appendChild(winchOnlyEle)
  }

  // RCA
  const combustion = props.combustion
  if(combustion !== undefined) {
    const combustionEle = document.createElement('div')
    combustionEle.innerText = `Combustion: ${combustion}`
    popupElement.appendChild(combustionEle)
  }

  // RCA
  const electric = props.electric
  if(electric !== undefined) {
    const electricEle = document.createElement('div')
    electricEle.innerText = `Electric: ${electric}`
    popupElement.appendChild(electricEle)
  }

  // RCA
  const turbine = props.turbine
  if(electric !== undefined) {
    const turbineEle = document.createElement('div')
    turbineEle.innerText = `Turbine: ${turbine}`
    popupElement.appendChild(turbineEle)
  }

  // RAA
  const icaoClass = props.icaoClass
  if(icaoClass) {
    const icaoClassEle = document.createElement('div')
    icaoClassEle.innerText = `ICAO class: ${icaoClass}`
    popupElement.appendChild(icaoClassEle)
  }
  

  // OBS
  const osmTags = props.osmTags
  if(osmTags) {

    const osmTagsEle = document.createElement('div')
    osmTagsEle.innerHTML = '<b> OSM Tags:</b>'
    osmTagsEle.classList.add('osmtaglist')

    let imageSrc: string = '';
    Object.entries(osmTags).forEach((keyValue) => {
      const tagEle = document.createElement('div')
      tagEle.classList.add('osmtag')
      const key = keyValue[0]
      let value = keyValue[1] as string
      if(key == 'website' || key == 'url') {
        value = `<a href="${value}" target="_blank">${value}</a>`
      } else if(key == 'wikipedia') {
        const split = value.split(':') 
        value = `<a href="https://${split[0]}.wikipedia.org/wiki/${split[1]}" target="_blank" rel="noopener noreferrer">${value}</a>`
      } else if(key == 'phone') {
        value = `<a href="tel:${value}" aria-label="Call ${value}">${value}</a>`
      } else if(key == 'image') {
        const split = value.split(':')
        imageSrc = value
        if(split[0] == 'File') {
          imageSrc = `https://commons.wikimedia.org/wiki/${value}`
        }
        value = `<a href="${imageSrc}" target="_blank">${value}</a>`
      }
      tagEle.innerHTML = `<b>${key}</b>: ${value}`
      osmTagsEle.appendChild(tagEle)
    })

    if(imageSrc.length) {
      const imageEle = document.createElement('img')
      imageEle.alt = 'Image could not be loaded'
      imageEle.height = 100
      imageEle.width = 100
      imageEle.src = imageSrc
      popupElement.appendChild(imageEle)
    }

    popupElement.appendChild(osmTagsEle)
  }
}
