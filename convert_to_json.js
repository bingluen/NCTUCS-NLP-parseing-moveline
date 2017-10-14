var fs = require('fs-extra');
var rp = require('request-promise');

let inputFilename = process.argv[2]
let outputFilename = process.argv[3] || 'output.json'

let input = fs.readFileSync(inputFilename, 'utf8')

let lines = input.split(/\n/).map((line) => {
    let split = line.split(' +++$+++ ')
    return {
        lineId: split[0],
        roleId: split[1],
        moiveId: split[2],
        roleName: split[3],
        sentences: split[4]
    }
})

function promiseGetPOS(raw) {
    return rp({
        method: 'POST',
        uri: 'http://localhost:8999',
        body: raw.sentences
    }).then((res) => {
        return {
            raw: raw,
            result: JSON.parse(res)
        };
    });
}

var lineChunks = []

while(lines.length) {
    lineChunks.push(lines.splice(0,1000))
}

lineChunks.forEach((lineChunk, index) => {
    let tasks = lineChunk.map((element) => promiseGetPOS(element));

    Promise.all(tasks)
        .then((result) => {
            console.log('part' + index + ' - ' + (index * 1000) + '~' + ((index + 1) * 1000 - 1))
            fs.writeJsonSync('part' + index + '_' + outputFilename, result)
            console.log(result)
        })
        .catch((err) => {
            console.log('part' + index + ' - ' + (index * 1000) + '~' + ((index + 1) * 1000 - 1))
            console.error(err)
        })
})