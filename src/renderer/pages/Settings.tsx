import { VegaLite, View } from 'react-vega'
import { VisualizationSpec } from 'vega-embed';
import * as vega from 'vega';
import React from 'react'

import Graph from '../components/Graph'

interface PlotProp {
  data: any,
  streamTimeDomains: any,
  endStream: any,
  switchChannel: any,
  startValues: any
}

const spec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'Streaming Data',
  mark: 'line',
  height: 200,
  width: 600,
  padding: 50,
  data: { name: 'data' },
  encoding: {
    x: {
      field: 'time',
      type: 'quantitative',
      scale: { domain: [0, 10] },
      axis: {
        title: 'time (s)'
      }
    },
    y: {
      field: 'channelData',
      type: 'quantitative',
      scale: { domain: [-0.5, 0] },
      axis: {
        title: 'channel data (mV)'
      }
    },
    color: { field: "key", type: "nominal" },
  },

};



const Settings: React.FC<PlotProp> = ({ data, streamTimeDomains, endStream, switchChannel, startValues }) => {
  const [view, setView] = React.useState<View>();
  const [intervalId, setIntervalId] = React.useState<any>()
  const [currentTime, setCurrentTime] = React.useState<any>()

  const startData = () => {
    streamTimeDomains("left")
    var currentData: any = { data: [] }
    // Frequency of data display
    const dataSize = 5
    function updateGraph() {
      //console.log(data)
      setCurrentTime((startValues.currentPacketTime + 978307200) * 1000)
      // Check if there's data from stream
      if (data.length > 0) {
        // Check if data for the current second is finished
        if (currentData.data.length === 0) {
          // Retrieve next second data from stream
          currentData = data.pop()
        }

        if (view) {
          // Array of data points to add to graph
          var current: any[] = []
          if (currentData.data.length > dataSize)
            current = currentData.data.splice(0, dataSize)
          else {
            current = currentData.data.splice(0, currentData.data.length)
          }
          const cs = vega
            .changeset()
            .insert(current)
            .remove((t: any) => {
              return t.time >= current[0].time
            })
          view.change('data', cs).run();
        }
      }
    }
    if (view) {
      updateGraph();
      setIntervalId(setInterval(updateGraph, 1000 / 250 * dataSize -2));
    }
  }

  return (
    <div>
      <ul>
        <li>
        
        </li>
        <li>
          <button className='button' onClick={()=>endStream('left')}>End Stream Left</button>
        </li>
      </ul>
      <div className='select'>
        <select onChange={(e: any) => switchChannel(e.target.value, 'left')}>
          <option value={0}>Channel 0</option>
          <option value={1}>Channel 1</option>
          <option value={2}>Channel 2</option>
          <option value={3}>Channel 3</option>
        </select>
      </div>
      <VegaLite spec={spec} onNewView={(view) => setView(view)} />
      <p>{(new Date(currentTime)).toTimeString()}</p>
    </div>
  )
}

export default Settings
