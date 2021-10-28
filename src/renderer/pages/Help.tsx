import React, { useEffect, useRef, useState } from 'react';
import { VegaLite, View } from 'react-vega';
import { VisualizationSpec } from 'vega-embed';
import * as vega from 'vega';

const visData =
  [
    {
      data: [
        { key: "channel 0", time: 0, channelData: 12 },
        { key: "channel 0", time: 0.2, channelData: 10 },
        { key: "channel 0", time: 0.4, channelData: 16 },
        { key: "channel 0", time: 0.6, channelData: 13 },
        { key: "channel 0", time: 0.8, channelData: 15 },
      ]
    },
    {
      data: [
        { key: "channel 0", time: 0, channelData: 17 },
        { key: "channel 0", time: 0.2, channelData: 19 },
        { key: "channel 0", time: 0.4, channelData: 14 },
        { key: "channel 0", time: 0.6, channelData: 18 },
        { key: "channel 0", time: 0.8, channelData: 13 },
      ]
    },
    {
      data: [
        { key: "channel 0", time: 0, channelData: 12 },
        { key: "channel 0", time: 0.2, channelData: 10 },
        { key: "channel 0", time: 0.4, channelData: 16 },
        { key: "channel 0", time: 0.6, channelData: 13 },
        { key: "channel 0", time: 0.8, channelData: 15 },
      ]
    },
    {
      data: [
        { key: "channel 0", time: 0, channelData: 17 },
        { key: "channel 0", time: 0.2, channelData: 19 },
        { key: "channel 0", time: 0.4, channelData: 14 },
        { key: "channel 0", time: 0.6, channelData: 18 },
        { key: "channel 0", time: 0.8, channelData: 13 },
      ]
    },
    {
      data: [
        { key: "channel 0", time: 0, channelData: 12 },
        { key: "channel 0", time: 0.2, channelData: 10 },
        { key: "channel 0", time: 0.4, channelData: 16 },
        { key: "channel 0", time: 0.6, channelData: 13 },
        { key: "channel 0", time: 0.8, channelData: 15 },
      ]
    },
    {
      data: [
        { key: "channel 0", time: 0, channelData: 17 },
        { key: "channel 0", time: 0.2, channelData: 19 },
        { key: "channel 0", time: 0.4, channelData: 14 },
        { key: "channel 0", time: 0.6, channelData: 18 },
        { key: "channel 0", time: 0.8, channelData: 13 },
      ]
    }
  ]


export function Help() {
  const [view, setView] = useState<View>();

  useEffect(() => {
    var currentData: any = { data: [] }
    function updateGraph() {
      
      if (currentData.data.length === 0 && visData.length>0) {
        currentData = visData.shift()
      }``


      console.log(currentData)
      if (view && currentData.data.length>0) {
        const current = currentData.data.shift()
        const cs = vega
          .changeset()
          .insert(current).remove((t:any) => {
            return t.time >= current.time
          })  
        view.change('data', cs).run();
        
      }

    }
    if (view) {
      updateGraph();
      const interval = setInterval(updateGraph, 1000);
      return () => clearInterval(interval);
    }
  }, [view]);

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
        scale: {domain: [0,1]}
      },
      y: {
        field: 'channelData',
        type: 'quantitative',
      },
      color: { field: "key", type: "nominal" },
    },

  };




  return (
    <>
      <h3>React Vega Streaming Data</h3>
      <div>
        <VegaLite
          spec={spec}
          //actions={false}
          //renderer={'svg'}
          onNewView={(view) => setView(view)}
        />
      </div>
    </>
  );
}
export default Help;