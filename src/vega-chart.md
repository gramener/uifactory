# Vega chart component

## Bar chart

<vega-chart spec="https://vega.github.io/vega/examples/bar-chart.vg.json" width="200" height="200">
</vega-chart>

## Isotype

<vega-chart spec="https://vega.github.io/editor/spec/vega-lite/isotype_bar_chart_emoji.vl.json">
  // Replace
  transform[0].calculate = transform[0].calculate.replace('🐄', '🐮')
  data.values[0].animal = 'cattle'
  data.values[1].animal = 'cattle'
  console.log(transform[0].calculate)
</vega-chart>

## Layered plot

<vega-chart spec="https://vega.github.io/editor/spec/vega-lite/layer_dual_axis.vl.json">
  data.url = 'https://vega.github.io/editor/data/weather.csv'
</vega-chart>

## Diverging stacked bar

<vega-chart spec="https://vega.github.io/editor/spec/vega-lite/bar_diverging_stack_transform.vl.json">
</vega-chart>

## SPLOM

<vega-chart spec="https://vega.github.io/editor/spec/vega-lite/interactive_splom.vl.json">
  spec.data.url = 'https://vega.github.io/editor/data/cars.json'
</vega-chart>

## Choropleth

<vega-chart spec="https://vega.github.io/editor/spec/vega-lite/geo_repeat.vl.json">
  spec.data.url = 'https://vega.github.io/editor/data/population_engineers_hurricanes.csv'
  spec.transform[0].from.data.url = 'https://vega.github.io/editor/data/us-10m.json'
</vega-chart>
