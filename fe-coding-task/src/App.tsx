import { useState, useRef, useEffect } from 'react';
import './App.css';
import { Button, List, ListItem, ListItemText, TextField, SelectChangeEvent, Grid, Box } from '@mui/material';
import { getAveragePrices } from './Requests';
import { useForm } from 'react-hook-form';
import Select from '@mui/material/Select';
import { Line } from 'react-chartjs-2';
import ls from 'local-storage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type houseType = {
  value: string, name: string
};

const houseTypesDictionary = [
  {value: "00", name: "Boliger i alt"}, 
  {value: "02", name: "Småhus"}, 
  {value: "03", name: "Blokkleiligheter"}
];

const quarters = [
  "2019K2",
  "2019K3",
  "2019K4",
  "2020K1",
  "2020K2",
  "2020K3",
  "2020K4",
  "2021K1",
  "2021K2",
  "2021K3",
  "2021K4",
  "2022K1",
  "2022K2",
  "2022K3",
];

 interface Statistic {
  houseTypes: string[];
  quarters: string[];
  description?: string;
 }

function random_rgba() {
  var o = Math.round, r = Math.random, s = 255;
  return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
}

function App() {
  const initialData = {
    labels: quarters,
    datasets: [
      {
        label: '',
        data: [0],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const selectedQuarters = useRef<string[]>([]);
  const selectedHouseTypes = useRef<string[]>([]);
  const descriptionField = useRef<HTMLInputElement>(null);
  const [chartDescription, setChartDescription] = useState('');
  const [savedStatistics, setSavedStatistics] = useState<Statistic[]>([]);
  const [data, setData] = useState(initialData);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    setChartFromUrl();
  }, []);

  useEffect(()=>{
    let statistics = ls('savedStatistics') as unknown as Statistic[];
    setSavedStatistics(statistics);
  }, []);

  const setChartFromUrl = () => {
    if (window.location.href.indexOf("selection") === -1) return; 
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const houseTypes = urlParams.get('housetypes')?.split(',');
    const quarters = urlParams.get('quarters')?.split(',');

    getAveragePrices(houseTypes, quarters).then(response => {
      if (window.location.href.indexOf("selection") !== -1) {
        setChart(response.data.value, houseTypes, quarters);
        return;
      }
    });
  }

  const setChart = (prices: number[], houseTypes: string[] = [], quarters: string[] = []) => {
    console.log(prices, houseTypes, quarters);

    let values = [...prices];

    let newDatasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; }[] = [];

    const quartersCount = quarters.length;
    houseTypes.forEach((houseType: string, index: number) => {
        const currentIndexQuarterStart = index * quartersCount;
        const currentIndexQuarterEnd = currentIndexQuarterStart + quartersCount;

        const prices = values.slice(currentIndexQuarterStart, currentIndexQuarterEnd);
        newDatasets.push({
            label: houseTypesDictionary.find((el: houseType) => el.value === houseType)?.name ?? '',
            data: prices,
            borderColor: random_rgba(),
            backgroundColor: random_rgba(),
        });
    });
   
    setData({
      labels: quarters,
      datasets: newDatasets,
    })
  }

  const onSubmit = (data: any) => {
    console.log(data);
    getAveragePrices(data.houseTypes, data.quarters).then(response => {
      setChart(response.data.value, data.houseTypes, data.quarters);
      window.history.pushState("", "", `selection?housetypes=${data.houseTypes}&quarters=${data.quarters}`);
      selectedHouseTypes.current = data.houseTypes;
      selectedQuarters.current = data.quarters;
    });
  }
  

  const handleChangeMultiple = (event:  any) => {
    const options = event.target.options;
    const value = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    
    ls(event.target.name, value);
  };

  const saveStatistics = () => {
    let savedStatisticsFromLocalStorage = (ls('savedStatistics') === null ? [] : ls('savedStatistics')) as Statistic[];

    const newStatistics: Statistic[] = [
      ...savedStatisticsFromLocalStorage,
      {
        houseTypes: selectedHouseTypes.current,
        quarters: selectedQuarters.current,
        description: descriptionField?.current?.value ?? '',
      }
    ];

    setSavedStatistics(newStatistics);
    ls('savedStatistics', newStatistics);
  }

  const selectStatistic = (data: Statistic) => {
    getAveragePrices(data.houseTypes, data.quarters).then(response => {
      setChart(response.data.value, data.houseTypes, data.quarters);
      window.history.pushState("", "", `selection?housetypes=${data.houseTypes}&quarters=${data.quarters}`);
      selectedHouseTypes.current = data.houseTypes;
      selectedQuarters.current = data.quarters;
      setChartDescription(data.description ?? '')
    });
  }

  return (
    <div className="App">
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4} style={{ maxWidth: 350 }}>
          <Box m={2}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="select-options">
              <Grid container spacing={2} justifyContent="space-around">
                <Grid item xs={6}>
                  <Select
                    {...register("houseTypes", {required: true})}
                    multiple
                    native
                    defaultValue={ls('houseTypes')}
                    onChange={handleChangeMultiple}
                    label="Native"
                    inputProps={{
                      id: 'select-multiple-native',
                    }}
                  >
                    {houseTypesDictionary.map((type) => (
                      <option key={type.name} value={type.value}>
                        {type.name}
                      </option>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={6}>
                  <Select
                      {...register("quarters", {required: true})}
                      multiple
                      native
                      defaultValue={ls('quarters')}
                      onChange={handleChangeMultiple}
                      label="Native"
                      inputProps={{
                        id: 'select-multiple-native',
                      }}
                    >
                      {quarters.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Select>
                  </Grid>
                </Grid>
              </div>
              <Button
              type="submit"
              variant="contained">
                Show chart
              </Button>
            </form>
          </Box>

          <Box m={2}>
            <Button 
              variant="contained"
              onClick={saveStatistics}
              disabled={!selectedHouseTypes.current.length && !selectedQuarters.current.length}>
                Save statistic
            </Button>
            <br/>
            Description: <input ref={descriptionField}></input>
          </Box>

          {/* <TextField
              id="outlined-multiline-flexible"
              label="Description"
              multiline
              maxRows={4}
      
              // value={value}
              // onChange={handleChange}
            /> */}

          <Box m={2}>
            <List sx={{
              maxWidth: 360,
              overflow: 'auto',
              maxHeight: 300,
            }}>
              {savedStatistics && savedStatistics.map((data, index)=>{
                  return (<ListItem onClick={() => selectStatistic(data)}>
                    <ListItemText key={`${data.houseTypes}${index}`}
                      primary={`House types: ${data.houseTypes} Quarters ${data.quarters}`}
                    />
                  </ListItem>)
                
              })}
            </List>
          </Box>
        </Grid>

        <Grid item xs={12} sm={8}>

          <div style={{ width: 'auto', height: 'auto'}}>
            <Line  data={data}  />
            <div>Description: {chartDescription ? chartDescription : '-'}</div>
          </div>      

        </Grid>
      </Grid>
    </div>
  );
}

export default App;