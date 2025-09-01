<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Map from 'ol/Map';
import * as olHelpers from '@/utils/ol-helpers';
import 'ol/ol.css';

const map = ref<Map | null>(null);
// Be carefull since google maps uses [latitude, longitude]
const BRIGHTLANDS_CAMPUS_COORDS = [5.97311012907296, 50.883308586237696]; // [longitude, latitude]

onMounted(() => {
    map.value = olHelpers.createMap('map', BRIGHTLANDS_CAMPUS_COORDS, 16);
});

</script>

<template>
    <div id="map"></div>
</template>

<style scoped>
#map {
    width: 100%;
    height: 100vh;
}
</style>