const request = require('sync-request');
const FormData = require('sync-request').FormData;

class AqualityAPI {
    constructor(token, projectId, apiURL) {
        this.token = token;
        this.projectId = projectId
        this.host = apiURL;
    }

    _createAuthHeaderValue() {
        return `Basic ${Buffer.from(`project:${this.projectId}:${this.token}`).toString('base64')}`;
    };

    _serializeToQueryString(object) {
        if (!object) {
            return '';
        }
        const str = [];
        for (const proprty in object) {
            if (object.hasOwnProperty(proprty)) {
                str.push(encodeURIComponent(proprty) + '=' + encodeURIComponent(object[proprty]));
            }
        }
        return `?${str.join('&')}`;
    };

    _getFullURL(endpoint, params) {
        return this.host + endpoint + this._serializeToQueryString(params);
    };

    _sendGet(endpoint, params) {
        try {
            const resp = request('GET', this._getFullURL(endpoint, params), {
                headers: {
                    'Authorization': this._createAuthHeaderValue(),
                    'Accept': 'application/json'
                }
            })
            return JSON.parse(resp.getBody('utf8'));
        } catch (error) {
            console.log(error)
            throw new Error(`Was not able to get ${endpoint}`);
        }
    };

    _sendPost(endpoint, params, body) {
        try {
            const resp = request('POST', this._getFullURL(endpoint, params),
                {
                    headers: {
                        'Authorization': this._createAuthHeaderValue(),
                        'Accept': 'application/json'
                    },
                    json: body
                })
            return JSON.parse(resp.getBody('utf8'));
        } catch (error) {
            throw new Error(`Was not able to create ${endpoint}: ${JSON.stringify(error)}\n
        URL: ${this._getFullURL(endpoint, params)}\n
        body:${JSON.stringify(body)}`);
        }
    };

    _sendPostFile(endpoint, params, file) {
        try {
            const formdata = new FormData();
            formdata.append(file)
            const resp = request('POST', this._getFullURL(endpoint, params),
                {
                    headers: {
                        'Authorization': this._createAuthHeaderValue(),
                        'Accept': 'application/json'
                    },
                    form: body
                })
            return JSON.parse(resp.getBody('utf8'));
        } catch (error) {
            throw new Error(`Was not able to create ${endpoint}: ${error.headers.errormessage}\n
        URL: ${this._getFullURL(endpoint, params)}\n
        body:${JSON.stringify(body)}`);
        }
    };

    _startTestrun(testRun) {
        return this._sendPost('/public/testrun/start', undefined, testRun);
    };

    _finishTestrun(id, project_id) {
        return this._sendGet('/public/testrun/finish', { id, project_id });
    };

    _createOrUpdateSuite(testSuite) {
        return this._sendPost('/public/suite/create-or-update', undefined, testSuite);
    };

    _createOrUpdateTest(test) {
        return this._sendPost('/public/test/create-or-update', undefined, test);
    };

    _startResults(test_id, test_run_id, project_id) {
        return this._sendGet('/public/test/result/start', { test_id, test_run_id, project_id });
    };

    _finishResults(result) {
        return this._sendPost('/public/test/result/finish', undefined, result);
    };

    _addAttachment(project_id, test_result_id, file) {
        return this._sendPostFile('/public/test/result/attachment', { project_id, test_result_id }, file);
    };

    createOrUpdateSuite(suite) {
        return this._createOrUpdateSuite(suite);
    }

    createOrUpdateTestRun(testrun) {
        return this._startTestrun(testrun);
    }

    createOrUpdateTest(test) {
        return this._createOrUpdateTest(test)
    }

    startResult(test_id, test_run_id, project_id) {
        return this._startResults(test_id, test_run_id, project_id);
    };

    finishResult(result) {
        return this._finishResults(result);
    };

    addAttachment(project_id, test_result_id) {
        return this._addAttachment(result);
    };

    startTestrun(testRun) {
        return this._startTestrun(testRun);
    };

    finishTestrun(id, project_id) {
        return this._finishTestrun(id, project_id);
    };

    getTestrun(project_id, id) {
        return this._sendGet('/testrun', { project_id, id });
    };
}

module.exports = AqualityAPI;
