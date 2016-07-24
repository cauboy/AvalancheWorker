var Promise = require('bluebird');

module.exports = createAvalancheWorker;

function createAvalancheWorker(opt) {
  if (!opt.getNewJob || (typeof opt.getNewJob !== 'function')) {
    throw new Error('The attribute getNewJob method needs to be a function');
  }

  // optional params
  var defaultOptions = {
    PENDING_TASKS_LIMIT: 10,
    FORCE_WORKER_TIME:  1000 * 60 * 5, // 5 minutes
    HEARTBEAT_INTERVAL: 1000 * 1, // 1 second
    onSuccess: function() {},
    onError:   function() {},
    onNoMoreJobs: function() {},
  };

  var options = Object.assign(defaultOptions, opt);
  var onError = opt.onError;
  var onSuccess = opt.onSuccess;
  var onNoMoreJobs = opt.onNoMoreJobs;
  var getNewJob = opt.getNewJob;

  // Private data
  var lastJobDoneDate = new Date();
  var numPending = 0;
  var moreJobsExist = true;
  var interval;

  return {
    start: start,
    stop: stop,
    numPending: numPending,
  };

  //// Functions

  function worker() {
    var self = this;
    if (numPending >= options.PENDING_TASKS_LIMIT) {
      return;
    }
    var currentJob;
    numPending++;
    getNewJob()
      .then(function(job) {
        currentJob = job;
        if (job) {
          worker();
          return job.process();
        }
        moreJobsExist = false;
        if (typeof options.onNoMoreJobs === 'function') {
          onNoMoreJobs(numPending);
        }
        return null;
      })
      .then(function(result) {
        if (!result) { return; }
        if (typeof options.onSuccess === 'function') {
          options.onSuccess(result, currentJob, new Date(), numPending);
        }
        worker();
      })
      .finally(function(data) {
        lastJobDoneDate = new Date();
        numPending--;
      })
      .catch(function(error) {
        options.onError(error, currentJob, new Date(), numPending);
      });
  }

  function start() {
    lastJobDoneDate = new Date();
    worker(getNewJob);
    heartbeat();
  }

  function stop() {
    clearInterval(interval);
  }

  function heartbeat() {
    interval = setInterval(function() {
      if (numPending === 0) {
        worker(getNewJob);
      } else if (needsReset()) {
        reset();
        worker(getNewJob);
      }
    }, options.HEARTBEAT_INTERVAL);
  }

  function needsReset() {
    var then = lastJobDoneDate.getTime();
    var now = new Date().getTime();
    return (now - then > options.FORCE_WORKER_TIME);
  }

  function reset(){
    numPending = 0;
    lastJobDoneDate = new Date();
  }
}

