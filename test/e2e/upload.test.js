
const { assert, driver } = require('vl-ui-core').Test;
const VlUploadPage = require('./pages/vl-upload.page');

describe('vl-upload', async () => {
    const vlUploadPage = new VlUploadPage(driver);

    before((done) => {
        vlUploadPage.load().then(() => {
            done();
        });
    });
});
