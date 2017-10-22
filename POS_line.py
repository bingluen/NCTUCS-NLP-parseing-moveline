# coding=UTF-8
import json
import sys
import requests

filename = sys.argv[1]
outputdir = sys.argv[2]

rawData = ''

with open(sys.argv[1], encoding='utf8') as source:
    rawData = json.load(source)

results = []

for (index, line) in enumerate(rawData):
    print(index, line['lineId'])
    res = json.loads(requests.post('http://localhost:8999', data=line['sentences'].encode('utf-8')).text)
    result = {
        'lineId': line['lineId'],
        'roleId': line['roleId'],
        'movieId': line['movieId'],
        'roleName': line['roleName'],
        'sentences': line['sentences'],
        'parsing': res
    }
    results.append(result)
    if len(results) % 100 == 0:
        with open(outputdir + '/output_' + str(int(index / 100) + 1) + '.json', 'w', encoding='utf-8') as output:
            json.dump(results, output)
        results = []

# remaining
with open(outputdir + '/output_' + str(int(index / 100) + 1) + '.json', 'w', encoding='utf-8') as output:
    json.dump(results, output)
