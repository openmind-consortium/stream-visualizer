import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom'

import Home from './pages/Home'
import Help from './pages/Help'
import Plot from './pages/Plot'
import Settings from './pages/Settings'

import Logo from './components/Logo'
import Header from './components/Header'
import Navigation from './components/Navigation'

// HACK (BNR): I don't know what the right way to get bridgeManagerService on
//             the window object. This is a hack around ts-compiler warnings
let mywindow: any = window

const App: React.FC = () => {
  const [bridges, setBridges] = React.useState<any>({})
  const [leftData, setLeftData] = React.useState<any[]>([])
  const [leftSettings, setLeftSettings] = React.useState<any>({ channel: 0, sampleRate: 250, range: 1 })
  const [leftStartValues, setLeftStartValues] = React.useState<any>({ startTime: -100, packetNumber: -1, currentPacketTime: -100 })

  const [rightData, setRightData] = React.useState<any>({ table: [] })

  React.useEffect(() => {
    mywindow.appService.getBridges().then((data: any) => {
      setBridges(data)
    })
  }, [])

  const streamTimeDomains = async (direction: string) => {
    console.log(bridges)
    mywindow.deviceManagerService.streamTimeDomains({ name: '//summit/bridge/NKW021653N', enableStream: true },
      (data: any) => {
        //console.log(data)
        const channel = leftSettings.channel
        processData(data, channel)
      });

  }

  const endStream = async () => {
    mywindow.deviceManagerService.streamTimeDomains({ name: '//summit/bridge/NKW021653N', enableStream: false },
      (data: any) => {
      })
    await new Promise(r => setTimeout(r, 1000));
    mywindow.location.reload(false)
  }

  const switchChannel = (channelNumber:number) => {
    setLeftSettings((prev: any) => {
      prev.channel = channelNumber
      return prev
    })
  }


  // Process streaming data and covert to data for Vega
  const processData = (streamData: any, channel: number) => {

    // store current packet time and packet number
    const packetTime = streamData.header.insTimestamp
    const packetNumber = streamData.header.dataTypeSequenceNumber
    // packets overflow at 255
    var packetDifference = packetNumber - leftStartValues.packetNumber
    if (packetDifference < 0) {
      packetDifference += 254
    }

    // case for same time interval
    if (packetTime - leftStartValues.startTime < 10) {
      // case for same second
      if (packetTime === leftStartValues.currentPacketTime) {
        // error for when data is pushed out first
        
          leftData.unshift({ data: [] })
        for (let i = 0; i < 25; i++) {
          leftData[0].data.push({ key: streamData.data[channel].channelId, time: leftStartValues.currentPacketTime - leftStartValues.startTime + 1 / 10 * packetDifference + i / 250, channelData: streamData.data[channel].channelData[i] })
        }
      }
      else {
        leftData.unshift({ data: [] })
        for (let i = 0; i < 25; i++) {
          leftData[0].data.push({ key: streamData.data[channel].channelId, time: leftStartValues.currentPacketTime - leftStartValues.startTime + 1 / 10 * packetDifference + i / 250, channelData: streamData.data[channel].channelData[i] })
        }
        setLeftStartValues((prev: any) => {
          prev.packetNumber = packetNumber
          prev.currentPacketTime = packetTime
          return prev
        })
      }
      //console.log("equal")

    }
    // case for outside time interval
    else {
      //console.log("not equal")
      leftData.unshift({ data: [] })
      for (let i = 0; i < 25; i++) {
        leftData[0].data.push({ key: streamData.data[channel].channelId, time: i / 250, channelData: streamData.data[channel].channelData[i] })
      }
      setLeftStartValues((prev: any) => {
        prev.startTime = packetTime
        prev.packetNumber = packetNumber
        prev.currentPacketTime = packetTime
        return prev
      })

    }
    console.log(leftData)
  }


  return (
    <Router>
      <div id="app-container">
        <Header />
        {/* Container for body other than header */}
        <div id='main-container'>
          {/* Sidebar */}
          <div id='sidebar'>
            <Logo />
            <Navigation />
          </div>
          {/* Main area */}
          <div id='main-window'>
            <Switch>

              <Route path='/settings'>
                <Settings />
              </Route>
              <Route path='/help'>
                <Help />
              </Route>
              <Route path='/plot'>
                <Home streamTimeDomains={streamTimeDomains} endStream={endStream} />
              </Route>
              <Route path='/'>
                <Plot data={leftData} streamTimeDomains={streamTimeDomains} endStream={endStream} switchChannel={switchChannel} startValues={leftStartValues} />
              </Route>
            </Switch>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App
