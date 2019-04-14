<template>
    <div class="trip-wrapper" @click="selectTrip">
        <div v-if="trip.departs" class="trip-departs-time">
            <p>Departs in xx minutes</p>
        </div>
        
        <div v-for="(segment, index) in trip.segments" :key="'trip-segment-' + index" class="trip-segment-wrapper">
            <div class="trip-segment-headsign">
                <span :style="{'background-color': '#' + segment.trip.route.color, 'color': '#' + segment.trip.route.textColor}">
                    <v-icon :color="'#' + segment.trip.route.textColor">train</v-icon> <strong>{{ segment.trip.headsign }}&nbsp;</strong>
                </span>
            </div>
            
            <div class="trip-segment-times">
                {{ formatTime(segment.enter.departureTime) }} <v-icon color="#111">arrow_forward</v-icon> {{ formatTime(segment.exit.arrivalTime) }}
            </div>
            <div class="trip-segment-status">
                <span v-html="getStatus(segment)"></span>
            </div>
            <div class="trip-segment-traveltime">
                &nbsp;<v-icon color="#111">access_time</v-icon> {{ formatTravelTime(segment.travelTime) }}
            </div>
            <div class="trip-segment-track">
                <span v-html="getTrack(segment)"></span>
            </div>

            <v-expand-transition>
                <rt-trip-details v-if="tripDetailsVisible" class="trip-segment-details" 
                    :trip="segment.trip" :enter="segment.enter" :exit="segment.exit">
                </rt-trip-details>
            </v-expand-transition>

            <div v-if="trip.transfers[index]" class="trip-segment-transfer">
                <div class="trip-segment-transfer-icon">
                    <v-icon color="#111">call_split</v-icon>
                </div>
                <div class="trip-segment-transfer-info">
                    <strong>&nbsp;Transfer @ {{ trip.transfers[index].stop.name }}</strong><br />
                    <v-icon color="#111">timelapse</v-icon> {{ formatTravelTime(trip.transfers[index].layoverTime) }}
                </div>
            </div>

        </div>

        <div v-if="trip.segments.length > 1" class="trip-total-traveltime">
            <strong>Total Travel Time</strong><br />
            <v-icon color="#111">access_time</v-icon> {{ formatTravelTime(trip.travelTime) }}
        </div>
    </div>
</template>


<script>
    const TripDetails = require("@/components/trip/TripDetails.vue").default;
    const datetime = require("@/utils/datetime.js");

    module.exports = {

        // ==== COMPONENT PROPS ==== //
        props: {
            trip: {
                type: Object,
                required: true
            },
            statusFeeds: {
                type: Array
            }
        },

        // ==== COMPONENT DATA ==== //
        data: function() {
            return {
                tripDetailsVisible: false
            }
        },

        // ==== ADDITIONAL COMPONENTS ==== //
        components: {
            'rt-trip-details': TripDetails
        },

        // ==== COMPONENT METHODS ==== //
        methods: {

            /**
             * Get the Segment's Departure Status
             * @param  {Object} segment Trip Segment
             * @return {string}         Departure Status
             */
            getStatus(segment) {
                for ( let i = 0; i < this.statusFeeds.length; i++ ) {
                    if ( this.statusFeeds[i].origin.id === segment.enter.stop.id ) {
                        for ( let j = 0; j < this.statusFeeds[i].departures.length; j++ ) {
                            if ( this.statusFeeds[i].departures[j].trip.shortName === segment.trip.shortName ) {
                                let status = this.statusFeeds[i].departures[j].status.status;
                                if ( status.toLowerCase() === "on time" || status.toLowerCase() === 'scheduled' ) {
                                    return "<span style='background-color: #4caf50; color: #fff; padding: 3px 5px; border-radius: 5px'>" + status + "</span>";
                                }
                                else {
                                    return "<span style='background-color: #ff5252; color: #fff; padding: 3px 5px; border-radius: 5px'>" + status + "</span>";
                                }
                            }
                        }
                    }
                }
            },

            /**
             * Get the Segment's Departure Status
             * @param  {Object} segment Trip Segment
             * @return {string}         Departure Status
             */
            getTrack(segment) {
                for ( let i = 0; i < this.statusFeeds.length; i++ ) {
                    if ( this.statusFeeds[i].origin.id === segment.enter.stop.id ) {
                        for ( let j = 0; j < this.statusFeeds[i].departures.length; j++ ) {
                            if ( this.statusFeeds[i].departures[j].trip.shortName === segment.trip.shortName ) {
                                let track = this.statusFeeds[i].departures[j].status.track;
                                if ( track && track !== "" ) {
                                    return "<span style='font-weight: 500'>Track " + track + "</span>";
                                }
                                else {
                                    return track;
                                }
                            }
                        }
                    }
                }
            },

            /**
             * Format the Arrival/Departure times to hh:mm ampm
             * @param  {string} time Arrival/Departure Time (HH:mm:ss)
             * @return {string}      Formatted Time
             */
            formatTime(time) {
                return datetime.HHmmssToTime(time);
            },

            /**
             * Format the travel/layover durations to x hours y minutes
             * @param  {string} mins Duration in minutes
             * @return {string}      Formatted Duration
             */
            formatTravelTime(mins) {
                return datetime.minutesToString(mins);
            },

            /**
             * Handle a selected trip
             * - Toggle the trip details visibility
             * @return {[type]} [description]
             */
            selectTrip: function() {
                this.tripDetailsVisible = !this.tripDetailsVisible;
            }
            
        }

    }

</script>


<style scoped>

    .trip-wrapper {
        padding: 15px 0;
        background: linear-gradient(to bottom, #ffffffaa, #ecececaa);
        border-top: 2px solid #ccc;
        cursor: pointer;
    }
    .trip-wrapper:hover {
        background-color: #ecececaa;
    }

    .trip-wrapper .v-icon {
        font-size: 16px !important;
    }
    
    .trip-departs-time {
        text-align: center;
        color: #ff6f00;
        font-size: 16px;
        font-weight: bold;
    }

    .trip-segment-wrapper {
        display: grid;
        grid-gap: 2px 10px;
        grid-template-columns: 1fr 125px;
        grid-template-areas: "headsign headsign" "times status" "traveltime track" "details details" "transfer transfer";
        padding: 15px 0 10px 0;
    }

    .trip-segment-headsign {
        grid-area: headsign;
        text-align: center;
        margin-bottom: 5px;
    }
    .trip-segment-headsign > span {
        border-radius: 5px;
        padding: 2px;
    }

    .trip-segment-times {
        grid-area: times;
        font-size: 14px;
        font-weight: bold;
        padding-left: 15px;
    }

    .trip-segment-status {
        grid-area: status;
        text-align: center;
        padding-right: 15px;
    }

    .trip-segment-traveltime {
        grid-area: traveltime;
        padding-left: 10px;
    }

    .trip-segment-track {
        grid-area: track;
        text-align: center;
        padding-right: 15px;
    }

    .trip-segment-transfer {
        grid-area: transfer;
        margin: 0 auto;
        padding: 15px 0 10px 0;
        display: grid;
        grid-gap: 10px;
        grid-template-columns: max-content 1fr;
        grid-template-areas: "transfer-icon transfer-info";
        align-items: center;
    }
    .trip-segment-transfer-icon {
        grid-area: transfer-icon;
        margin: 0 auto;
    }
    .trip-segment-transfer-icon .v-icon {
        font-size: 24px !important;
        -webkit-transform: rotate(90deg);
        -moz-transform: rotate(90deg);
        -o-transform: rotate(90deg);
        -ms-transform: rotate(90deg);
        transform: rotate(90deg);
    }
    .trip-segment-transfer-info {
        grid-area: transfer-info;
    }

    .trip-segment-details {
        grid-area: details;
        margin-top: 10px;
    }

    .trip-total-traveltime {
        text-align: center;
        padding-top: 10px;
    }
</style>