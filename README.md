# Scheduling API
Scheduling API provides interface to TCN databases holding appointment data.

Azure Function app with multiple functions:

-  **slots**: http trigger function for api get 'testCentres' endpoint, which will return the slots based on the date range you pass in

Example query:

```
https://my-api.com/api/v1/tcn/a/testCentres/123/slots?testTypes=%5B%22CAR%22%5D&dateFrom=2020-06-29&dateTo=2020-07-03
```

- **reservations** - http trigger function for the api post 'reservations' endpoint which will make a reservation for the slot provided

Example body:
```
[
    {
        testCentreId: '1234567890',
        startDateTime: '2020-07-30T09:00:22+0000',
        testTypes: ['Car'],
        lockTime: 1,
        quantity: 1,
    }
]
```

- **bookings** - http trigger function for the api post 'bookings' endpoint which will confirm a previously reserved slot

Example body:
```
[
    {
        bookingReferenceId: '1234567890',
        reservationId: '1234567890',
        notes: '',
        behaviouralMarkers: '',
    }
]
```

Each has its own folder in the project root with a `function.json` config

## Versions
All http triggered functions are versioned. The table below shows the latest and all available versions.
|Function| Latest Version  |  Available Versions |  
|--|--|--|
| slots | 1 | 1
| reservations | 1 | 1
| bookings | 1 | 1

To use a specific endpoint you must provide the version number as part of the url for example:
```
https://my-api.com/api/v1/tcn/a/testCentres/123/slots?testTypes=%5B%22CAR%22%5D&dateFrom=2020-06-29&dateTo=2020-07-03
```

## Environment Variables

```
APPINSIGHTS_INSTRUMENTATIONKEY=
NODE_ENV=
USE_TCN_STUB=
TCN_STUB_URL=
TCN_URL=
```
## Build

Install node modules:

```
npm install
```

Compile the ts source:

```
npm run build
```

## Deploy

Deploy via VSCode with the Azure Functions extension

## Tests

All tests are housed in `tests/(unit|int)/(module)/*.test.ts`

Run all the tests:

```
npm run test
```

Watch the tests:

```
npm run test:watch
```

Run test coverage:

```
npm run test:coverage
```

See the generated `coverage` directory for the results. Output types are editable in `package.json`.
