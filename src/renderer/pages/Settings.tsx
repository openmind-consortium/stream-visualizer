import React, { useEffect, useRef, useState } from 'react';
import { VegaLite, View } from 'react-vega';
import { VisualizationSpec } from 'vega-embed';
import * as vega from 'vega';

const sineDataSupplier = (x: number) => {
  const y = 100 / 2 + 40 * Math.sin(x / 2);
  return { x: x, value: Math.floor(y) };
};

export function Settings() {
  const [view, setView] = useState<View>();
  const z = -20;
  const x = 0;

  const ref = useRef({
    x,
    z,
  });

  useEffect(() => {
    function updateGraph() {
      const data = sineDataSupplier(ref.current.x);
      ref.current.x++;
      ref.current.z++;

      const cs = vega
        .changeset()
        .insert(data)
        .remove((t: { x: number; value: number }) => {
          return t.x < ref.current.z;
        });
      if (view)
        view.change('data', cs).run();
    }

    if (view) {
      updateGraph();
      const interval = setInterval(updateGraph, 300);
      return () => clearInterval(interval);
    }
  }, [view]);

  const spec: VisualizationSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Streaming Data',
    height: 200,
    width: 600,
    data: { name: 'data' },
    mark: "circle",
    encoding: {
      x: {
        field: 'x',
        type: 'ordinal',
        axis: {
          title: 'x axis',
        },
      },
      y: {
        field: 'value',
        type: 'quantitative',
        axis: {
          title: 'values',
        },
      },
    },
  };

  return (
    <>
      <h3>React Vega Streaming Data</h3>
      <div>
        <VegaLite
          spec={spec}
          actions={false}
          renderer={'svg'}
          onNewView={(view) => setView(view)}
        />
      </div>
    </>
  );
}
export default Settings;
