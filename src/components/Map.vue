<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Map from 'ol/Map';
import {
    createMap, addNfzOverlay, addNoFlyZones
} from '@/utils/ol-helpers';
import 'ol/ol.css';

const map = ref<Map | null>(null);
// Be carefull since google maps uses [latitude, longitude]
const BRIGHTLANDS_CAMPUS_COORDS = [5.97311012907296, 50.883308586237696]; // [longitude, latitude]

onMounted(() => {
    // create map
    map.value = createMap('map', BRIGHTLANDS_CAMPUS_COORDS, 16);

    if (!map) {
        throw new Error('Invalid Map')
    }

    // add no fly zones
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
    addNoFlyZones(map.value as Map, noFlyZones);

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