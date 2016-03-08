import Point2 from './Point2.js';

const MM = {

    τ: 6.28318530718,
    π: 3.14159265359,
    quarter_τ: 1.57079632679,

    deg_to_rad: 0.0174532925,
    rad_to_deg: 57.2958,

    solar_position: function (day, hour, minute, second) {

        var f = hour / 24.0 + minute / 1440.0 + second / 86400.0;
        var δ = Math.asin(Math.sin(23.45 * MM.deg_to_rad) * Math.sin(MM.τ / 365 * (day + f - 81))) ;
        var α = Math.PI * f * 2;
        

        return {
            declination: δ,
            right_ascension: α
        }
    },

    day_of_year(date) {
        var start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
        var diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    },

    Point2: Point2
}

export { MM as default };