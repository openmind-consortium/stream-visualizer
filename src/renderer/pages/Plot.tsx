import { VegaLite, View } from 'react-vega'
import { VisualizationSpec } from 'vega-embed';
import * as vega from 'vega';
import React from 'react'


interface PlotProp {
  leftData: any,
  rightData: any,
  streamTimeDomains: any,
  endStream: any,
  switchChannel: any,
  leftStartValues: any,
  rightStartValues: any
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



const Plot: React.FC<PlotProp> = ({ leftData, rightData, streamTimeDomains, endStream, switchChannel, leftStartValues, rightStartValues }) => {
  const [leftView, setLeftView] = React.useState<View>();
  const [rightView, setRightView] = React.useState<View>();
  const [intervalId, setIntervalId] = React.useState<any>()
  const [currentTime, setCurrentTime] = React.useState<any>()

  const startLeftData = () => {
    streamTimeDomains("left")
    var currentLeftData: any = { data: [] }
    // Frequency of data display
    const dataSize = 5
    function updateLeftGraph() {
      
      setCurrentTime((leftStartValues.currentPacketTime + 978307200) * 1000)
      // Check if there's data from stream
      if (leftData.length > 0) {
        // Check if data for the current second is finished
        if (currentLeftData.data.length === 0) {
          // Retrieve next second data from stream
          currentLeftData = leftData.pop()
          console.log(currentLeftData)
        }

        if (leftView) {
          // Array of data points to add to graph
          var current: any[] = []
          if (currentLeftData.data.length > dataSize)
            current = currentLeftData.data.splice(0, dataSize)
          else {
            current = currentLeftData.data.splice(0, currentLeftData.data.length)
          }
          const cs = vega
            .changeset()
            .insert(current)
            .remove((t: any) => {
              return t.time >= current[0].time
            })
          leftView.change('data', cs).run();
        }
      }
    }
    streamTimeDomains("right")
    var currentRightData: any = { data: [] }
    // Frequency of data display
    function updateRightGraph() {
      // Check if there's data from stream
      if (rightData.length > 0) {
        // Check if data for the current second is finished
        if (currentRightData.data.length === 0) {
          // Retrieve next second data from stream
          currentRightData = rightData.pop()
        }

        if (rightView) {
          // Array of data points to add to graph
          var current: any[] = []
          if (currentRightData.data.length > dataSize)
            current = currentRightData.data.splice(0, dataSize)
          else {
            current = currentRightData.data.splice(0, currentRightData.data.length)
          }
          const cs = vega
            .changeset()
            .insert(current)
            .remove((t: any) => {
              return t.time >= current[0].time
            })
          rightView.change('data', cs).run();
        }
      }
    }
    if (leftView) {
      updateLeftGraph();
      updateRightGraph()
      setInterval(()=>{updateLeftGraph(); updateRightGraph()}, 1000 / 250 * dataSize -2);
    }
  }
  

  
  return (
    <div>
      <ul>
        <li>
          <button className='button' onClick={()=>{startLeftData();}}>Stream Left</button>
        </li>
        <li>
          <button className='button' onClick={()=>{endStream('left'); endStream('right')}}>End Stream Left</button>
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
      <VegaLite spec={spec} onNewView={(view) => setLeftView(view)} />
      <VegaLite spec={spec} onNewView={(view) => setRightView(view)} />
      <p>{(new Date(currentTime)).toTimeString()}</p>
    </div>
  )
}

export default Plot
