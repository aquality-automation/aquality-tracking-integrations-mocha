#!/usr/bin/env node
'use strict';

var AqualityReporter = require('./src/aqualityReporter');
const commands = {
    start: 'start',
    finish: 'finish'
}

const args = process.argv.slice(2);
const type = args[0];
const project_id = args[2];
const token = args[3];
const api_url = args[1];
const aqualityReporter = new AqualityReporter({token, project_id, api_url});


const createSuite = () => {
    return aqualityReporter.createOrUpdateTestSuite(args[4]);
}

const closeTestRun = () => {
    aqualityReporter.finishTestrun(args[4])
}

const createTestRun = (suite) => {
    const testrun = aqualityReporter.startTestrun({execution_environment: args[5], test_suite_id: suite.id, build_name: args[6]})
    console.log(testrun.id)
}

(function main() {
    switch(type){
        case commands.start:
                createTestRun(createSuite());
                break;
        case commands.finish:
                closeTestRun();
                break;
        default:
            throw new Error(`Wrong '${JSON.stringify(type)}' command. Only ${commands.start} and ${commands.finish} are allowed here!`)
    }
})();