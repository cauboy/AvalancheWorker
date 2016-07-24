var avalancheWorker = require('./')
var Promise = require('bluebird');
var test = require('tape')

test('It should throw an error when getNewJob is not defined in the initialization process', function(t) {
  var worker;
  try {
    worker = new avalancheWorker({});
  } catch (e) {}
  t.equal(worker, undefined);
  t.end();
});

test('Avalanche Worker is a library to process jobs. It\'s best suited for jobs that are not computational heavy such as HTTP requests, sending emails or push notifications.', function(t) {

  t.equal(typeof avalancheWorker, 'function');

  var numJobs = 5;
  var jobs = [];
  for (var i = 0; i < numJobs; i++) {
    var job = new Job(i);
    jobs.push(job);
  }
  function getNewJob() {
    return new Promise(function(resolve, reject) {
      resolve(jobs.shift());
    });
  }
  function Job(i) {
    return {
      id: i,
      process: function() {
        return new Promise(function(resolve, reject) {
          job.done = true;
          resolve(job);
        });
      }
    };
  }

  var processedJobs = 0;
  var opt = {
    getNewJob: getNewJob,
    onNoMoreJobs: function() {
      worker.stop();
    },
    onSuccess: function(date, task, numPending, data) {
      processedJobs++;
    },
    onError: function(date, task, numPending, reason) {
    },
    HEARTBEAT_INTERVAL: 1000,
  };
  worker = new avalancheWorker(opt);
  worker.start();

  setTimeout(function() {
    t.equal(processedJobs, numJobs);
    t.end();
  }, 1000);
});
