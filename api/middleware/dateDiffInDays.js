//Export a function that calculates the number of days between a given range of dates (inclusive)
module.exports = (startDate, endDate) => {
    //Convert the input date strings into JavaScript Date objects
    var a = new Date(startDate);
    var b = new Date(endDate);

    //Define the number of milliseconds in a day
    var _MS_PER_DAY = 1000 * 60 * 60 * 24;

    //Calculate the UTC (Coordinated Universal Time) timestamps for the start and end dates
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    //Calculate the number of days between the two UTC timestamps (inclusive)
    //and round the result to the nearest day using Math.floor
    return Math.floor((utc2 - utc1) / _MS_PER_DAY) + 1;
}
