var fs = require('fs-extra');
var rp = require('request-promise');

let inputFilename = process.argv[2]
let input = fs.readFileSync(inputFilename, 'utf8')

let lines = input.split(/\n/).map((line) => {
    let split = line.split(' +++$+++ ')
    return {
        movieId: split[0],
        movieYear: split[1],
        IMDBRating: split[2],
        IMDBVote: split[3],
        gender: split[4]
    }
})