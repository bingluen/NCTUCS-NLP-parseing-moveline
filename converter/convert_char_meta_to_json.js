var fs = require('fs-extra');
var rp = require('request-promise');

let inputFilename = process.argv[2]
let input = fs.readFileSync(inputFilename, 'utf8')

let lines = input.split(/\n/).map((line) => {
    let split = line.split(' +++$+++ ')
    return {
        roleId: split[0],
        roleName: split[1],
        movieId: split[2],
        movieTitle: split[3],
        gender: split[4],
        posCredits: split[5]
    }
})

fs.writeJSONSync('movie_character_metadata.json', lines)