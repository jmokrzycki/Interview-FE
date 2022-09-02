import axios from 'axios';

export const getAveragePrices = (houseTypes: any, quarters: any) => {
    return axios.post('https://data.ssb.no/api/v0/no/table/07241', {
    "query": [
        {
            "code": "Boligtype",
            "selection": {
                "filter": "item",
                "values": houseTypes
            }
        },
        {
            "code": "ContentsCode",
            "selection": {
            "filter": "item",
                "values": [
                    "KvPris"
                ]
            }
        },
        {
            "code": "Tid",
            "selection": {
                "filter": "item",
                "values": quarters
            }
        }
    ],
    "response": {
        "format": "json-stat2"
    }
  })
}