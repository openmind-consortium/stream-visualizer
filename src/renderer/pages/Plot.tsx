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
  params: [
    { name: "minYRange", value: -0.5,
      bind: {input: "range", min: -10, max: -0.5, step: 0.5} },
    { name: "maxYRange", value: 0,
      bind: {input: "range", min: 0, max: 10, step: 0.5} }
  ],
  encoding: {
    x: {
      field: 'x',
      type: 'quantitative',
      scale: { domain: [0, 10] },
      axis: {
        title: 'time (s)'
      }
    },
    y: {
      field: 'y',
      type: 'quantitative',
      scale: { domain: [{expr: "minYRange"}, {expr: "maxYRange"}] },
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
  const [currentLeftTime, setCurrentLeftTime] = React.useState<any>()
  const [currentRightTime, setCurrentRightTime] = React.useState<any>()

  const [streaming, setStreaming] = React.useState<boolean>(false)
  const [resolution, setResolution] = React.useState<number>(50)



  const startData = () => {
    setStreaming(true)
    streamTimeDomains("left")
    streamTimeDomains("right")
    const incomingDataSize = 10
    var currentLeftData: any = { data: [] }
    // Frequency of data display
    const leftDataSize = incomingDataSize*10/resolution
    const rightDataSize = incomingDataSize*10/resolution
    function updateLeftGraph() {
      
      // Check if there's data from stream
      if (leftData.length > 0) {
        // Check if data for the current second is finished
        if (currentLeftData.data.length === 0) {
          // Retrieve next second data from stream
          currentLeftData = leftData.pop()
        }

        if (leftView) {
          // Array of data points to add to graph
          var current: any[] = []
          if (currentLeftData.data.length > leftDataSize)
            current = currentLeftData.data.splice(0, leftDataSize)
          else {
            current = currentLeftData.data.splice(0, currentLeftData.data.length)
          }
          const cs = vega
            .changeset()
            .insert(current)
            .remove((t: any) => {
              return t.x >= current[0].x
            })
          leftView.change('data', cs).run();
        }
      }
      if (leftStartValues.currentPacketTime!==-100)
        setCurrentLeftTime((leftStartValues.currentPacketTime + 952037690) * 1000)
    }

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
          if (currentRightData.data.length > rightDataSize)
            current = currentRightData.data.splice(0, rightDataSize)
          else {
            current = currentRightData.data.splice(0, currentRightData.data.length)
          }
          const cs = vega
            .changeset()
            .insert(current)
            .remove((t: any) => {
              return t.x >= current[0].x
            })
          rightView.change('data', cs).run();
        }
      }
      if (rightStartValues.currentPacketTime!==-100)
        setCurrentRightTime((rightStartValues.currentPacketTime + 952037690) * 1000)
    }
    if (leftView) {
      updateLeftGraph();
      updateRightGraph()
      setInterval(() => { updateLeftGraph(); updateRightGraph() }, 1000 / (incomingDataSize*10) * rightDataSize-2);
    }
  }



  return (
    <div>
      <div>
        <button className='button is-primary m-2' onClick={() => { startData(); }}>Stream</button>
        <button className='button is-danger m-2' onClick={() => { endStream('left'); endStream('right') }}>End Stream</button>
        <button className='button m-2 ml-6' onClick={()=>setResolution(10)} disabled={streaming}>Lower Resolution</button>
      </div>
      <div>
        <br></br>
        <div className='level has-text-centered m-2'>
          <p className="title is-4 m-2">Left</p>
          <p>{currentLeftTime? new Date(currentLeftTime).toTimeString() :''}</p>
        </div>
        <div className='level'>
          <div className='level-item m-2'>
            <div className='select'>
              <select onChange={(e: any) => switchChannel(e.target.value, 'left')}>
                <option value={0}>Channel 0</option>
                <option value={1}>Channel 1</option>
                <option value={2}>Channel 2</option>
                <option value={3}>Channel 3</option>
              </select>
            </div>
          </div>
        
          <VegaLite className='level-item' spec={spec} onNewView={(view) => setLeftView(view)} />
        </div>
        <div className='level has-text-centered m-2'>
          <p className="title is-4 m-2">Right</p>
          <p>{currentRightTime? new Date(currentRightTime).toTimeString():''}</p>
        </div>

        <div className='level'>

          <div className='level-item m-2'>
            <div className='select'>
              <select onChange={(e: any) => switchChannel(e.target.value, 'right')}>
                <option value={0}>Channel 0</option>
                <option value={1}>Channel 1</option>
                <option value={2}>Channel 2</option>
                <option value={3}>Channel 3</option>
              </select>
            </div>
          </div>

          <VegaLite className='level-item' spec={spec} onNewView={(view) => setRightView(view)} />
        </div>
      </div>
    </div>
  )
}

export default Plot
