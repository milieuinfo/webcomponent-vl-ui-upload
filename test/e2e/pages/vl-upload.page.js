const VlUpload = require('../components/vl-upload');
const { Page } = require('vl-ui-core').Test;
const { Config } = require('vl-ui-core').Test;
const { By } = require('selenium-webdriver');

class VlUploadPage extends Page {
    async _getUpload(selector) {
        return new VlUpload(this.driver, selector);
    }

    async getUpload() {
    	return this._getUpload("#vl-upload");
    }

    async getUploadError() {
    	return this._getUpload("#vl-upload-error");
    }

    async getUploadAutoProcess() {
    	return this._getUpload("#vl-upload-auto-process");
    }
    
    async changeAllUploadUrlsTo(url) {
    	const script = `document.querySelectorAll("vl-upload").forEach(upload => upload.setAttribute("url", "${url}"));`;
    	return this.driver.executeScript(script);
    }

    async uploadFiles() {
    	const script = `document.querySelector("#vl-upload").upload();`;
    	return this.driver.executeScript(script);
    }
    
    async load() {
        await super.load(Config.baseUrl + '/demo/vl-upload.html');
    }
}

module.exports = VlUploadPage;
