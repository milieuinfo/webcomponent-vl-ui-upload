const VlUpload = require('../components/vl-upload');
const { Page } = require('vl-ui-core').Test;
const { Config } = require('vl-ui-core').Test;

class VlUploadPage extends Page {
    async _getUpload(selector) {
        return new VlUpload(this.driver, selector);
    }

    async load() {
        await super.load(Config.baseUrl + '/demo/vl-upload.html');
    }
}

module.exports = VlUploadPage;
