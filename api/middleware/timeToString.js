//Export a function that converts a 12-hour time format to a 24-hour time format.
//This function is a convenience method for easily handling time modifiers.
module.exports = (time12h) => {
    //Split the input time into 'time' and 'modifier' parts
    var [time, modifier] = time12h.split(' ');

    //Split the 'time' part into 'hours' and 'minutes'
    let [hours, minutes] = time.split(':');

    //Handle the special case when 'hours' is '12' (midnight in 12-hour format)
    if (hours === '12') {
        hours = '00';
    }

    //If the 'modifier' is 'PM', add 12 hours to 'hours' to convert to 24-hour format
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }

    //Return the converted time in 24-hour format as a string
    return `${hours}${minutes}`;
}
