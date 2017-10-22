var fs = require('fs-extra');
var _ = require('lodash/core');

let word_count_per_line = []
let word_count_global = []

files = fs.readdirSync('./').filter(file => file.match('output'))

files.forEach((el) => {
    rawJSON = JSON.parse(fs.readFileSync(el))
    rawJSON.splice(9, 20).filter((el) => el['sentences'].length > 0).forEach((el) => {
        word_count_per_line.push({
            lineId: el['lineId'],
            sentences: el['sentences'],
            tokens: el['parsing']['sentences'][0]['tokens'].map((el) => ({
                lemma: el['lemma'],
                pos: el['pos'],
                count: 1
            })).reduce((pv, cv, index, array) => {
                sameWord = pv.find((el) => el.lemma === cv.lemma)
                if (sameWord === undefined) {
                    pv.push(cv)
                } else {
                    sameWord.count += 1
                }
                return pv
            }, [])
        })
    })

    word_count_global = word_count_per_line.map((el) => el.tokens)
        .reduce((pv, cv) => pv.concat(cv), [])
        .reduce((pv, cv, index, array) => {
            sameWord = pv.find((el) => el.lemma === cv.lemma)
            if (sameWord === undefined) {
                pv.push({
                    lemma: cv.lemma,
                    pos: cv.pos,
                    count: 1
                })
            } else {
                sameWord.count +=1
            }
            return pv
        }, [])
});


// Compute idf
word_count_global.forEach((el) => {
    el['idf'] = Math.log10(1.0 * word_count_per_line.length / el.count)
})

// Compute tf-idf
word_count_per_line.forEach((line) => {
    line.tokens.forEach((token) => {
        idf = word_count_global.find((word) => word.lemma === token.lemma).idf
        token['tf-idf'] = 1.0 * token.count * idf
    })
})

// console.log('word count per line')
// console.log(word_count_per_line)
// word_count_per_line.forEach((el) => { console.log(el) })
// console.log('word count global')
// console.log(word_count_global)

// Select 300 word
/**
 * ＰＯＳ黑名單
 *  助動詞、BE動詞 VBP
 *  冠詞 DT 
 *  連接詞 CC IN TO
 *  代名詞 PRP$ PRP
 *  標點符號 !,.:'
 *  疑問詞 WP WRB
 *  關係代名詞 WDT
 * ＷＯＲＤ黑名單 先不做（好懶得窮舉）
 *  not
 *  sometime
 *  other
 */
var removePOS = ['VBP', 'DT', 'CC', 'IN', 'PRP', '!', ',', '.', ':', '\'\'', 'WP', 'WRB', 'WDT', '``', 'TO']

// 統計每個 word 的 tf-idf，如果多句出現則以數值高的為基準，最後把 idf 合併回去
tf_idf_table = word_count_per_line
    .map((el) => el.tokens)
    .reduce((pv, cv, i) => {
        cv.forEach((token) => {
            let target = pv.find((el) => el.lemma === token.lemma);
            if (target === undefined) {
                pv.push(_.clone(token))
            } else if (target['tf-idf'] < token['tf-idf']) {
                target['tf-idf'] = token['tf-idf'];
            }
        })
        return pv
    }, [])
    .map((token) => {
        token.idf = word_count_global.find((el) => el.lemma === token.lemma).idf
        return token
    })


//挑 tf-idf 高的
var selectedWord = tf_idf_table.filter((el) => {
    // remove 代名詞、文法動詞（be 動詞、助動詞）、介系詞、冠詞
    return removePOS.findIndex((rm) => el.pos === rm) === -1
}).sort((a, b) =>  {
    return a['tf-idf'] <= b['tf-idf']
}).splice(0, 300)


// Output
var selectedLine = ['L36326',
    'L294442',
    'L569822',
    'L133500',
    'L191930',
    'L402729',
    'L481523',
    'L552446',
    'L553640',
    'L603014',]
var selectedLemma = selectedWord.map((el) => el.lemma)
var line1 = selectedLemma.map((el) => el.toLowerCase()).join('|')
var line2 = selectedWord.map((el) => el.idf.toFixed(1)).join(',')
var perLine = word_count_per_line.filter((line) => selectedLine.findIndex((lineId) => lineId === line.lineId) > -1).map(
    (movie_line) => selectedLemma.map((word) => {
        let target = movie_line.tokens.find((token) => token.lemma === word)
        return target === undefined ? 0 : target['tf-idf'].toFixed(1)
    }).join(',')
)

var output = fs.createWriteStream('task1', {
    flags: 'w',
    encoding: 'utf8'
})

output.write(line1 + '\n')
output.write(line2 + '\n')
perLine.forEach((line) => {
    output.write(line + '\n')
})

