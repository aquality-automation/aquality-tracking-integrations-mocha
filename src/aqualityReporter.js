var mocha = require('mocha');
const Status = { PASSED: 2, INPROGRESS: 4, FAILED: 1, PENDING: 5 };
const AqalityAPI = require('./aquality.api');
const diff = require('diff');

const _getTestcaseStatus = (status) => {
  if (status === 'disabled' || status === 'pending') {
    return Status.PENDING;
  } else if (status === 'passed') {
    return Status.PASSED;
  } else {
    return Status.FAILED;
  }
};

const _createUnifiedDiff = ({ actual, expected }) => {
  return diff.createPatch('string', actual, expected)
    .split('\n')
    .splice(4)
    .map(line => {
      if (line.match(/@@/)) {
        return null;
      }
      if (line.match(/\\ No newline/)) {
        return null;
      }
      return line.replace(/^(-|\+)/, '$1 ');
    })
    .filter(line => typeof line !== 'undefined' && line !== null)
    .join('\n');
}

const _normalizeErr = (err) => {
  const { name, message, actual, expected, stack, showDiff } = err;
  let errMessage;
  let errDiff;

  function sameType(a, b) {
    const objToString = Object.prototype.toString;
    return objToString.call(a) === objToString.call(b);
  }

  if (showDiff !== false && sameType(actual, expected) && expected !== undefined) {
    err.actual = JSON.stringify(actual);
    err.expected = JSON.stringify(expected);
    errDiff = _createUnifiedDiff(err);
  }

  if (name && message) {
    errMessage = `${name}: ${message}`;
  } else if (stack) {
    errMessage = stack.replace(/\n.*/g, '');
  }

  return {
    message: errMessage,
    estack: stack,
    diff: errDiff
  };
}


function AqualityReporter(runner, options) {
  const config = options.reporterOptions;
  const aqualityAPI = new AqalityAPI(config.token, config.projectId, config.url)
  mocha.reporters.Base.call(this, runner);

  runner.on('start', function () {
    try {
      console.log(`Creating suite for ${config.projectId} project`)
      const suite = aqualityAPI.createOrUpdateSuite({ name: "All", project_id: config.projectId });
      console.log(`Starting testrun for ${suite.id} suite`)
      this.testrun = aqualityAPI.startTestrun({ test_suite_id: suite.id, project_id: config.projectId, build_name: 'test' });
    } catch (err) {
      console.log(err);
    }
  });

  runner.on('end', function () {
    try {
      console.log(`Finish testrun ${this.testrun.id}`)
      aqualityAPI.finishTestrun(this.testrun.id, this.testrun.project_id);
    } catch (err) {
      console.log(err);
    }
  });

  runner.on('test', function (test) {
    try {
      console.log(`Creatint test ${test.title} for ${this.testrun.test_suite_id} suite and ${this.testrun.id} testrun.`);
      const atTest = aqualityAPI.createOrUpdateTest({ name: test.title, project_id: config.projectId, suites: [{ id: this.testrun.test_suite_id }] });
      console.log(`Starting result for ${atTest.id} test and ${this.testrun.id} testrun.`);
      this.result = aqualityAPI.startResult(atTest.id, this.testrun.id, config.projectId);
    } catch (err) {
      console.log(err);
    }
  });

  runner.on('test end', function (test) {
    try {
      this.result.final_result_id = _getTestcaseStatus(test.state)
      if (this.result.final_result_id !== Status.PASSED) {
        console.log(test)
        const error = _normalizeErr(test.err);
        this.result.fail_reason = error.message;
        this.result.log = error.estack;
      }
      console.log(`Finishing result for ${this.result.id} result for ${config.project_id} project and ${this.testrun.id} testrun.`);
      aqualityAPI.finishResult(this.result)
    } catch (err) {
      console.log(err);
    }
  });
}

mocha.utils.inherits(AqualityReporter, mocha.reporters.Spec);

module.exports = AqualityReporter;
