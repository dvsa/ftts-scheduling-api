# Scheduling API

Scheduling API provides an interface to TCN databases holding appointment data.

## Endpoints
Scheduling API consists of several endpoints, documentation for these endpoints can be found at https://wiki.dvsacloud.uk/display/FB/0005.+Scheduling+API

|Endpoints | Methods | Description | Latest Version | Available Versions
|--|--|--|--|--|
| slots | GET | returns slots from a TCN in the required date range| 1 | 1
| slotsTB | GET | returns slots from a TCN in the required date range. Specific for the Trainer Booker Service | 1 | 1
| reservations | POST DELETE | create and delete reservations with a TCN | 1 | 1
| bookings| GET POST PATCH DELETE | retrieve, create, update and delete bookings with a TCN | 1 | 1

## Timer Functions
Scheduling API contains a timer function for managing the behavioural markers for bookings; documentation can be found at https://wiki.dvsacloud.uk/display/FB/0011.+Behavioural+markers+synchronizer

|Function | Description | Latest Version | Available Versions
|--|--|--|--|
| Behavior Markers Sync | Updates a TCN about behavioural markers for upcoming bookings | 1 | 1

## Getting Started
  
1)  Install node modules
```
npm install
```

2. Create a `local.settings.json` file by running `npm run copy-config`

#### Caching
3. Scheduling API uses Redis to cache available slots therefore you will need to download Redis locally from homebrew or directly from the site https://redis.io/download 
```
brew install redis
brew services start redis
```

4. . Run the code locally
```
npm run func:start
```

## Build
1. Install node modules:
```
npm install
```
2. Compile the ts source:
```
npm run build
```

## Tests
All tests are housed in `tests/(unit|int)/(module)/*.test.ts`

### Run all the tests:
```
npm run test
```

### Watch the tests:
```
npm run test:watch
```

### Run test coverage:
```
npm run test:coverage
```

See the generated `coverage` directory for the results. Output types are editable in `package.json`.
