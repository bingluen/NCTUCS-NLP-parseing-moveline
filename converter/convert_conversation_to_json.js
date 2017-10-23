var fs = require('fs-extra');
var rp = require('request-promise');

let inputFilename = process.argv[2]
let input = fs.readFileSync(inputFilename, 'utf8')

let lines = input.split(/\n/).map((line) => {
    let split = line.split(' +++$+++ ')
    return {
        roleId1: split[0],
        roleId2: split[1],
        movieId: split[2],
        conversation: split[3]
    }
})

fs.writeJSONSync('movie_conversations.json', lines)