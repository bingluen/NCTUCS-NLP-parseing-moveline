import json
import sys
import requests

filename = sys.argv[1]

rawData = ''

with open(sys.argv[1]) as source:
    rawData = json.load(source)

results = [] 

for line in rawData:
    res = json.loads(requests.post('http://localhost:8999', data=line['sentences']).text)
    result = {
        'lineId': line['lineId'],
        'roleId': line['roleId'],
        'movieId': line['movieId'],
        'roleName': line['roleName'],
        'sentences': line['sentences'],
        'parsing': res
    }
    results.append(result)

with open('output.json', 'w') as output:
    json.dump(result, output)
