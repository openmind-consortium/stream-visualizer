import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom'
import {LTD} from 'downsample'

import Plot from './pages/Plot'

// HACK (BNR): I don't know what the right way to get bridgeManagerService on
//             the window object. This is a hack around ts-compiler warnings
let mywindow: any = window

const App: React.FC = () => {
  const [bridges, setBridges] = React.useState<any>({})

  const [leftData, setLeftData] = React.useState<any[]>([])
  const [leftSettings, setLeftSettings] = React.useState<any>({ channel: 0 })
  const [leftStartValues, setLeftStartValues] = React.useState<any>({ startTime: -100, packetNumber: -1, currentPacketTime: -100 })

  const [rightData, setRightData] = React.useState<any[]>([])
  const [rightSettings, setRightSettings] = React.useState<any>({ channel: 0 })
  const [rightStartValues, setRightStartValues] = React.useState<any>({ startTime: -100, packetNumber: -1, currentPacketTime: -100 })


  React.useEffect(() => {
    mywindow.appService.getBridges().then((data: any) => {
      setBridges(data)
    })
  }, [])

  const streamTimeDomains = async (direction: string) => {
    console.log(bridges)
    mywindow.deviceManagerService.streamTimeDomains({ name: direction === 'left' ? bridges.left : bridges.right, enableStream: true },
      (data: any) => {
        const settings = direction === 'left' ? leftSettings : rightSettings
        processData(data, settings.channel, direction)
      });

  }

  const endStream = async (direction: string) => {
    mywindow.deviceManagerService.streamTimeDomains({ name: direction === 'left' ? bridges.left : bridges.right, enableStream: false }, console.log)
    mywindow.location.reload(false)
  }

  const switchChannel = (channelNumber: number, direction: string) => {
    const setChannel = direction === 'left' ? setLeftSettings : setRightSettings
    setChannel((prev: any) => {
      prev.channel = channelNumber
      return prev
    })
  }

  // Process streaming data and covert to data for Vega
  const processData = (streamData: any, channel: number, direction: string) => {

    // which device
    const device = direction === 'left' ? bridges.left : bridges.right
    const sampleRate = direction === 'left'? bridges.leftSampleRate : bridges.rightSampleRate
    const displayData = direction === 'left' ? leftData : rightData
    const displayStartValues = direction === 'left' ? leftStartValues : rightStartValues
    const setDisplayStartValues = direction === 'left' ? setLeftStartValues : setRightStartValues

    if (streamData.name.includes(device)) {
      // store current packet time and packet number
      const packetTime = streamData.header.insTimestamp
      const packetNumber = streamData.header.dataTypeSequenceNumber
      // packets overflow at 255
      var packetDifference = packetNumber - displayStartValues.packetNumber
      if (packetDifference < 0) {
        packetDifference += 254
      }

      //const downSampledData = LTD(streamData.data[channel].channelData, 50)
      displayData.unshift({ data: [] })
      for (let i = 0; i < streamData.data[channel].channelData.length; i++) {
        displayData[0].data.push({ key: streamData.data[channel].channelId, x: displayStartValues.currentPacketTime - displayStartValues.startTime + 1 / 10 * packetDifference + i / (streamData.data[channel].channelData.length*10), y: streamData.data[channel].channelData[i] })
      }
      if (displayData[0].data.length>10){
        try{
          // incoming data size
          displayData[0].data=LTD(displayData[0].data, 10)
        }
        catch{
        }
      }
      else{
        displayData[0].data=[]
      }
        
      // case for same time interval
      if (packetTime - displayStartValues.startTime < 10) {
        // case for same second
        if (packetTime !== displayStartValues.currentPacketTime) {
          setDisplayStartValues((prev: any) => {
            prev.packetNumber = packetNumber
            prev.currentPacketTime = packetTime
            return prev
          })
        }
      }
      // case for outside time interval
      else {
        setDisplayStartValues((prev: any) => {
          prev.startTime = packetTime
          prev.packetNumber = packetNumber
          prev.currentPacketTime = packetTime
          return prev
        })
      }
      //console.log(rightData)
      //console.log(leftData)
    }

  }


  return (
    <Router>
      <div id="app-container">
        {/* Container for body other than header */}
        <div id='main-container'>
          {/* Sidebar */}

          {/* Main area */}
          <div id='main-window'>
            <Switch>
              <Route path='/'>
                <Plot leftData={leftData} rightData={rightData} streamTimeDomains={streamTimeDomains} endStream={endStream} switchChannel={switchChannel} leftStartValues={leftStartValues} rightStartValues={rightStartValues} />
              </Route>
            </Switch>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App
