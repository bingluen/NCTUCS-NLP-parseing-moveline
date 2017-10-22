var fs = require('fs-extra');

files = fs.readdirSync('./').filter(file => file.match('output'))

var idf_table = []
var tf_idf_table = []

files.forEach(el => {
	rawJSON = JSON.parse(fs.readFileSync(el))
		// Remove empty sentences
		.filter(el => el['sentences'].length > 0)

	// Alias
	let lines = rawJSON

	lines.forEach(line => {
		let tokenCollection = line.parsing.sentences
			.map(sentences => sentences.tokens)
			.reduce((collection, tokens) => collection.concat(tokens), [])
		// Count tf for each line
		tf_idf_table.push({
			lineId: line.lineId,
			sentences: line.sentences,
			tokens: tokenCollection
				// remove duplicate token
				.filter((token, index, tokens) =>
					tokens.slice(0, index).findIndex(previousToken => 
						previousToken.lemma === token.lemma) === -1
					)
				// mapping to tf for each unique token
				.map(uniqueToken => ({
					lemma: uniqueToken.lemma,
					pos: uniqueToken.pos,
					ref: tokenCollection
						// find same toke in same line
						.filter(token => token.lemma === uniqueToken.lemma)
						// get those index in line
						.map(token => token.index),
					tf: tokenCollection
						// find same toke in same line
						.filter(token => token.lemma === uniqueToken.lemma)
						// get those index in line
						.map(token => token.index).length
				}))
		})

		// Count reference of each token
		tokenCollection
			// remove duplicate token
			.filter((token, index, tokens) =>
				tokens.slice(0, index).findIndex(previousToken => 
					previousToken.lemma === token.lemma) === -1
				)
			.forEach(uniqueToken => {
				// find them on idf table
				target = idf_table.find(token => token.lemma === uniqueToken.lemma)
				if (target === undefined) {
					// If not exist, add it.
					idf_table.push({
						lemma: uniqueToken.lemma,
						pos: uniqueToken.pos,
						ref: [line.lineId],
					})
				} else {
					// else update it.
					target.ref.push(line.lineId)
				}
			})

			// Alias
			let numLines = tf_idf_table.length

			// Compute idf for each token
			idf_table.forEach(token => {
				token.idf = Math.log10(1.0 * numLines / token.ref.length)
			})

	})
})

// Compute tf-idf for each token on each lin
tf_idf_table.forEach(line => {
	line.tokens.forEach(token => {
		let idf = idf_table.find(idfToken => idfToken.lemma === token.lemma).idf
		token['tf-idf'] = token.tf * idf
	})
})

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

let selectedTokens = tf_idf_table
	// Get tokens
	.reduce((tokens, line) => tokens.concat(line.tokens), [])
	// Descending order by tf-idf 
	.sort((a, b) => b['tf-idf'] - a['tf-idf'])
	// Remove duplicate token
	.filter((token, index, tokens) => 
		tokens.slice(0, index).findIndex(previousToken => 
			token.lemma === previousToken.lemma) === -1
	)
	// Remove non-semantic token by POS
	.filter(token => removePOS.findIndex(pos => token.pos === pos) === -1)
	// Mapping to lemma
	.map(uniqueToken => uniqueToken.lemma)
	// Get the first three hundred token
	.slice(0, 300)

// Output result

let outputLines = []
// line 1
outputLines.push(
	selectedTokens.map(token => token.toLowerCase()).join('|')
)
// line 2
outputLines.push(
	selectedTokens.map(selectedToken => 
		idf_table.find(token => token.lemma === selectedToken).idf.toFixed(2)
	).join(',')
)

let selectedLines = ['L36326','L294442','L569822','L133500','L191930','L402729','L481523','L552446','L553640','L603014']
// tf-idf table
outputLines = outputLines.concat(
	selectedLines
		// Find selected line
		.map(lineId => tf_idf_table.find(line => line.lineId === lineId))
		// mapping to tf-idf data
		.map(line => line.tokens
			// Remove unselected tokens
			.filter(token => 
				selectedTokens.findIndex(selectedToken => token.lemma === selectedToken) > -1
				)
			.reduce((row, token) => {
				let column = selectedTokens.findIndex(selectedToken => token.lemma === selectedToken)
				row[column] = token['tf-idf'].toFixed(2)
				return row
			}, Array(selectedTokens.length).fill(0))
			.join(',')
		)
)

console.log(outputLines)
fs.writeFileSync('task1', outputLines.join('\n'))