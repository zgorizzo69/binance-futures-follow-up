import { Button, CssBaseline, InputLabel, MenuItem, TextField } from '@material-ui/core'
import React, { useCallback } from 'react'
import { CellProps, FilterProps, FilterValue, IdType, Row, TableInstance } from 'react-table'

import { Page } from './Page'
import { Table } from './Table'
import { PositionData, makeData } from './utils'

// This is a custom aggregator that
// takes in an array of values and
// returns the rounded median
function roundedMedian(values: any[]) {
  let min = values[0] || ''
  let max = values[0] || ''

  values.forEach((value) => {
    min = Math.min(min, value)
    max = Math.max(max, value)
  })

  return Math.round((min + max) / 2)
}

function filterGreaterThan(rows: Array<Row<any>>, id: Array<IdType<any>>, filterValue: FilterValue) {
  return rows.filter((row) => {
    const rowValue = row.values[id[0]]
    return rowValue >= filterValue
  })
}

// This is an autoRemove method on the filter function that
// when given the new filter value and returns true, the filter
// will be automatically removed. Normally this is just an undefined
// check, but here, we want to remove the filter if it's not a number
filterGreaterThan.autoRemove = (val: any) => typeof val !== 'number'

function SelectColumnFilter({
  column: { filterValue, render, setFilter, preFilteredRows, id },
}: FilterProps<PositionData>) {
  const options = React.useMemo(() => {
    const options = new Set<any>()
    preFilteredRows.forEach((row) => {
      options.add(row.values[id])
    })
    return [...Array.from(options.values())]
  }, [id, preFilteredRows])

  return (
    <TextField
      select
      label={render('Header')}
      value={filterValue || ''}
      onChange={(e) => {
        setFilter(e.target.value || undefined)
      }}
    >
      <MenuItem value={''}>All</MenuItem>
      {options.map((option, i) => (
        <MenuItem key={i} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  )
}

const getMinMax = (rows: Row<PositionData>[], id: IdType<PositionData>) => {
  let min = rows.length ? rows[0].values[id] : 0
  let max = rows.length ? rows[0].values[id] : 0
  rows.forEach((row) => {
    min = Math.min(row.values[id], min)
    max = Math.max(row.values[id], max)
  })
  return [min, max]
}

function SliderColumnFilter({
  column: { render, filterValue, setFilter, preFilteredRows, id },
}: FilterProps<PositionData>) {
  const [min, max] = React.useMemo(() => getMinMax(preFilteredRows, id), [id, preFilteredRows])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}
    >
      <TextField
        name={id}
        label={render('Header')}
        type='range'
        inputProps={{
          min,
          max,
        }}
        value={filterValue || min}
        onChange={(e) => {
          setFilter(parseInt(e.target.value, 10))
        }}
      />
      <Button variant='outlined' style={{ width: 60, height: 36 }} onClick={() => setFilter(undefined)}>
        Off
      </Button>
    </div>
  )
}

const useActiveElement = () => {
  const [active, setActive] = React.useState(document.activeElement)

  const handleFocusIn = () => {
    setActive(document.activeElement)
  }

  React.useEffect(() => {
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [])

  return active
}

// This is a custom UI for our 'between' or number range
// filter. It uses two number boxes and filters rows to
// ones that have values between the two
function NumberRangeColumnFilter({
  column: { filterValue = [], render, preFilteredRows, setFilter, id },
}: FilterProps<PositionData>) {
  const [min, max] = React.useMemo(() => getMinMax(preFilteredRows, id), [id, preFilteredRows])
  const focusedElement = useActiveElement()
  const hasFocus = focusedElement && (focusedElement.id === `${id}_1` || focusedElement.id === `${id}_2`)
  return (
    <>
      <InputLabel htmlFor={id} shrink focused={!!hasFocus}>
        {render('Header')}
      </InputLabel>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingTop: 5,
        }}
      >
        <TextField
          id={`${id}_1`}
          value={filterValue[0] || ''}
          type='number'
          onChange={(e) => {
            const val = e.target.value
            setFilter((old: any[] = []) => [val ? parseInt(val, 10) : undefined, old[1]])
          }}
          placeholder={`Min (${min})`}
          style={{
            width: '70px',
            marginRight: '0.5rem',
          }}
        />
        to
        <TextField
          id={`${id}_2`}
          value={filterValue[1] || ''}
          type='number'
          onChange={(e) => {
            const val = e.target.value
            setFilter((old: any[] = []) => [old[0], val ? parseInt(val, 10) : undefined])
          }}
          placeholder={`Max (${max})`}
          style={{
            width: '70px',
            marginLeft: '0.5rem',
          }}
        />
      </div>
    </>
  )
}

const columns = [
  {
    Header: 'Name',
    columns: [
      {
        Header: 'Team',
        accessor: 'team',
        aggregate: 'count',
        Aggregated: ({ cell: { value } }: CellProps<PositionData>) => `${value} Names`,
      },
      {
        Header: 'Username',
        accessor: 'username',
        aggregate: 'uniqueCount',
        filter: 'fuzzyText',
        Aggregated: ({ cell: { value } }: CellProps<PositionData>) => `${value} Unique Names`,
      },
    ],
  },
  {
    Header: 'Info',
    columns: [
      {
        Header: 'Symbol',
        accessor: 'symbol',
        disableGroupBy: true,
        defaultCanSort: false,
        disableSortBy: false,
      },
      {
        Header: 'Type',
        accessor: 'type',
        aggregate: 'uniqueCount',
        filter: 'fuzzyText',
        Aggregated: ({ cell: { value } }: CellProps<PositionData>) => `${value} Unique Names`,
      },
      {
        Header: 'Entry Price',
        accessor: 'entryPrice',
        width: 150,
        minWidth: 150,
        align: 'right',
        Filter: SliderColumnFilter,
        filter: 'equals',
        aggregate: 'average',
        disableGroupBy: true,
        defaultCanSort: false,
        disableSortBy: false,
        Aggregated: ({ cell: { value } }: CellProps<PositionData>) => `${value} (avg)`,
      },
      {
        Header: 'Amount',
        accessor: 'positionAmt',
        width: 50,
        minWidth: 50,
        align: 'right',
        Filter: SliderColumnFilter,
        filter: 'equals',
        aggregate: 'average',
        disableGroupBy: true,
        defaultCanSort: false,
        disableSortBy: false,
        Aggregated: ({ cell: { value } }: CellProps<PositionData>) => `${value} (avg)`,
      },
      {
        Header: 'Status',
        accessor: 'status',
        aggregate: 'uniqueCount',
        filter: 'fuzzyText',
        Aggregated: ({ cell: { value } }: CellProps<PositionData>) => `${value} Unique Names`,
      },
      {
        Header: 'Leverage',
        accessor: 'leverage',
        disableGroupBy: true,
      },
      {
        Header: 'Updated Time',
        accessor: 'updatedTime',
        disableGroupBy: true,
      },
    ],
  },
] //.flatMap((c:any)=>c.columns) // remove comment to drop header groups

const App: React.FC = () => {
  const [data, setData] = React.useState<PositionData[]>()
  React.useEffect(() => {
    // Create an scoped async function in the hook
    async function anyNameFunction() {
      await makeData(data ?? [], setData)
    } // Execute the created function directly
    anyNameFunction()
  }, [])

  const dummy = useCallback(
    (instance: TableInstance<PositionData>) => () => {
      console.log(
        'Selected',
        instance.selectedFlatRows.map((v) => `'${v.original.team} ${v.original.username}'`).join(', ')
      )
    },
    []
  )
  const refresh = async () => {
    await makeData(data ?? [], setData)
  }

  return (
    <Page>
      <CssBaseline />
      <h1>Binance Futures Positions - Live</h1>
      <button onClick={refresh}>Refresh</button>
      <Table<PositionData>
        name={'testTable'}
        columns={columns}
        data={data ?? []}
        onAdd={dummy}
        onEdit={dummy}
        onDelete={dummy}
      />
    </Page>
  )
}

export default App
