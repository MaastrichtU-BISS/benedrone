<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Map from 'ol/Map';
import {
    createMap, addControlLayerSwitcher, addControlGeocoder, addNfzOverlay, addNoFlyZones
} from '@/utils/ol-helpers';
import type { NFZDataset } from '@/types';
// styles
import 'ol/ol.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import 'ol-geocoder/dist/ol-geocoder.css';

const map = ref<Map | null>(null);
// Google maps uses [latitude, longitude]
const BRIGHTLANDS_CAMPUS_COORDS = [5.97311012907296, 50.883308586237696]; // [longitude, latitude]

onMounted(async () => {
    // create map
    map.value = createMap('map', BRIGHTLANDS_CAMPUS_COORDS, 16);

    if (!map?.value) {
        throw new Error('Invalid Map')
    }

    // add map controls
    addControlLayerSwitcher(map.value as Map);
    addControlGeocoder(map.value as Map);

    // add no-fly zones
    const json = await fetch('/data/nfz/index.json');
    const data = await json.json();
    const NFZdatasets: NFZDataset[] = data.datasets;
    addNoFlyZones(map.value as Map, NFZdatasets);

    // add info tooltip to nfz when clicked
    addNfzOverlay(map.value as Map, 'overlayPopup');
});

</script>

<template>
    <div id="map"></div>
    <div id="overlayPopup" class="ol-popup"></div>
</template>

<style scoped>
#map {
    width: 100%;
    height: 100vh;
}

#overlayPopup {
    background-color: white;
    padding: 8px;
    border-radius: 10px;
}
</style>