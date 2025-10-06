<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Map from 'ol/Map';
import {
    createMap, addNfzOverlay, addNoFlyZones
} from '@/utils/ol-helpers';
import type { NFZFeaturesCollection } from '@/utils/types';
import 'ol/ol.css';

const map = ref<Map | null>(null);
// Be carefull since google maps uses [latitude, longitude]
const BRIGHTLANDS_CAMPUS_COORDS = [5.97311012907296, 50.883308586237696]; // [longitude, latitude]

onMounted(async () => {
    // create map
    map.value = createMap('map', BRIGHTLANDS_CAMPUS_COORDS, 16);

    if (!map) {
        throw new Error('Invalid Map')
    }

    // add no fly zones
    const noFlyZones: NFZFeaturesCollection[] = [
        {
            url: 'pdok/landingsite',
            borderColor: '#ff0000',
            fillColor: 'rgba(255,0,0,0.8)'
        },
        {
            url: 'pdok/luchtvaartgebieden',
            borderColor: 'rgba(171, 137, 23, 0.6)',
            fillColor: 'rgba(242, 210, 87, 0.6)'
        },
        {
            url: 'pdok/luchtvaartgebieden-zonder-natura-2000',
            borderColor: 'rgba(31, 77, 39, 0.6)',
            fillColor: 'rgba(63, 145, 66, 0.6)'
        }
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