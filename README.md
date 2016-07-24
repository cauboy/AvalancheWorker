# avalanche-worker

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Avalanche Worker is a library to process jobs. It's best suited for jobs that are not computational heavy such as HTTP requests, sending emails or push notifications.

## Installation
```bash
npm install avalanche-worker --save
```
[![NPM](https://nodei.co/npm/avalanche-worker.png)](https://www.npmjs.com/package/avalanche-worker)


## Usage
Two things must be properly defined to make the Avalanche Worker work:

1. The ```getNewJob``` method in the options must be set
2. The job it returns needs to have a certain structure

### The job object
A valid job must have a method called process which returns a promise.
A falsy literal as the return value of ```getNewJob()``` means that there are currently no more jobs to be done.

The following would be a valid _job_:
```javascript
var validJob = new Job(id);
function Job(id) {
  return {
    id: id,                   // optional
    process: function() {     // obligatory
      return new Promise(resolve, reject) {
        setTimeout(function() {
          resolve(Math.random());
        }, 100);
      }
    },
  };
}
```

### The getNewJob method
The function ```getNewJob``` needs to return a promise that resolves to a valid job.

### Example

```javascript
var avalancheWorker = require('avalanche-worker');

// These are all available options. The key 'getNewJobs' is obligatory.
var opt = {
  getNewJob: getNewJob,
  PENDING_TASKS_LIMIT: 10,
  FORCE_WORKER_TIME:  1000 * 60 * 5, // time in ms
  HEARTBEAT_INTERVAL: 1000 * 1, // time in ms
  onSuccess: function(result, job, doneDate, numPending) {
    console.log('Job done', job, result);
  },
  onError: function(error, job, doneDate, numPending) {
    console.error('Error while processing a job', job, error);
  },
  onNoMoreJobs: function(numPending) {
    console.log('Currently, there are no more jobs. ' + numPending + 'jobs are pending.')
  },
};

var worker = new avalancheWorker(opt);

// Start the worker
worker.start()

// Stop retrieving new jobs after 60s
setTimeout(function() {
  worker.stop();
  console.log('Stopped getting new jobs.' + worker.numPending + ' jobs pending will stille be completed.');
}, 60 * 1000);

// Definitions

function getNewJob() {
  return jobs.shift();
}

// Create a fake job queue
var jobs = [];
var numJobs = 5;
for (var i = 0; i < numJobs; i++) {
  jobs.push(new Job(i));
}

function Job(id) {
  return {
    id: id,                   // optional
    process: function() {     // obligatory
      return new Promise(resolve, reject) {
        setTimeout(function() {
          resolve(Math.random());
        }, 100);
      }
    },
  };
}
```

## License

MIT, see [LICENSE.md](http://github.com/=/avalanche-worker/blob/master/LICENSE.md) for details.
